package jobs

import (
	"context"
	"encoding/json"
	"log"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	goredis "github.com/redis/go-redis/v9"
	"gitlab.ct.fh-salzburg.ac.at/fhs52920/tradevise/app/worker/db"
	"gitlab.ct.fh-salzburg.ac.at/fhs52920/tradevise/app/worker/scraper"
)

func RunLiveTicker(rdb *goredis.Client, pool *pgxpool.Pool) {
	log.Println("[LiveTicker] started")
	ticker := time.NewTicker(time.Minute)
	defer ticker.Stop()

	go runLiveTickerFetchNow(rdb, pool)
	runScheduledMarketSync(rdb, pool)

	for range ticker.C {
		runScheduledMarketSync(rdb, pool)
	}
}

func runScheduledMarketSync(rdb *goredis.Client, pool *pgxpool.Pool) {
	symbols, err := loadLiveTickerSymbols(rdb, pool)
	if err != nil {
		log.Printf("[LiveTicker] failed to load symbols: %s", err)
		return
	}

	if len(symbols) == 0 {
		log.Println("[LiveTicker] no active or held symbols, skipping")
		return
	}

	log.Printf("[LiveTicker] syncing %d symbols", len(symbols))
	for _, symbol := range symbols {
		if err := syncMarketData(rdb, pool, symbol); err != nil {
			log.Printf("[LiveTicker] sync failed for %s: %s", symbol, err)
			if scraper.IsProviderCoolingDownError(err) {
				break
			}
			time.Sleep(300 * time.Millisecond)
			continue
		}

		time.Sleep(300 * time.Millisecond)
	}
}

func loadLiveTickerSymbols(rdb *goredis.Client, pool *pgxpool.Pool) ([]string, error) {
	activeSymbols, err := rdb.SMembers(context.Background(), "active:symbols").Result()
	if err != nil {
		return nil, err
	}

	heldSymbols, err := db.LoadPortfolioSymbols(pool)
	if err != nil {
		return nil, err
	}

	unique := make(map[string]struct{}, len(activeSymbols)+len(heldSymbols))
	for _, symbol := range activeSymbols {
		if symbol == "" {
			continue
		}
		unique[symbol] = struct{}{}
	}
	for _, symbol := range heldSymbols {
		if symbol == "" {
			continue
		}
		unique[symbol] = struct{}{}
	}

	result := make([]string, 0, len(unique))
	for symbol := range unique {
		result = append(result, symbol)
	}

	return result, nil
}

func runLiveTickerFetchNow(rdb *goredis.Client, pool *pgxpool.Pool) {
	sub := rdb.Subscribe(context.Background(), "stocklive:fetchnow")
	ch := sub.Channel()
	var inFlight sync.Map
	limiter := make(chan struct{}, 2)

	for msg := range ch {
		symbol := msg.Payload
		if symbol == "" {
			continue
		}
		if scraper.IsProviderCoolingDown() {
			continue
		}
		if _, loaded := inFlight.LoadOrStore(symbol, struct{}{}); loaded {
			continue
		}

		go func(symbol string) {
			defer inFlight.Delete(symbol)
			limiter <- struct{}{}
			defer func() {
				<-limiter
			}()

			if scraper.IsProviderCoolingDown() {
				return
			}

			log.Printf("[LiveTicker] immediate sync requested for %s", symbol)
			if err := syncMarketData(rdb, pool, symbol); err != nil {
				log.Printf("[LiveTicker] immediate sync failed for %s: %s", symbol, err)
			}
		}(symbol)
	}
}

func syncMarketData(rdb *goredis.Client, pool *pgxpool.Pool, symbol string) error {
	snapshot, err := scraper.FetchMarketSnapshot(symbol)
	if err != nil {
		return err
	}

	if err := db.UpsertIntraday(pool, symbol, snapshot.IntradayPoints); err != nil {
		return err
	}
	if err := db.UpsertDaily(pool, symbol, snapshot.DailyPoints); err != nil {
		return err
	}
	if err := db.UpsertStockMeta(pool, snapshot.Meta); err != nil {
		return err
	}
	name := snapshot.Meta.Name
	if name == "" {
		name = symbol
	}
	if err := db.UpsertTrackedSymbol(pool, symbol, snapshot.Meta.Currency, name); err != nil {
		return err
	}

	metaPayload, err := json.Marshal(snapshot.Meta)
	if err != nil {
		return err
	}
	if err := rdb.Set(context.Background(), "stockmeta:"+symbol, metaPayload, 24*time.Hour).Err(); err != nil {
		return err
	}

	payload, err := json.Marshal(snapshot.LiveEvent)
	if err != nil {
		return err
	}

	if err := rdb.Set(context.Background(), "stocklatest:"+symbol, payload, 2*time.Minute).Err(); err != nil {
		return err
	}

	if err := rdb.Publish(context.Background(), "stocklive:"+symbol, payload).Err(); err != nil {
		return err
	}

	log.Printf("[LiveTicker] published %s → %.2f EUR (%+.2f%%)", symbol, snapshot.LiveEvent.Price, snapshot.LiveEvent.ChangePercent)
	return nil
}
