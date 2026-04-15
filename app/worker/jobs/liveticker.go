package jobs

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"sync"
	"time"

	goredis "github.com/redis/go-redis/v9"
	"gitlab.ct.fh-salzburg.ac.at/fhs52920/tradevise/app/worker/model"
	"gitlab.ct.fh-salzburg.ac.at/fhs52920/tradevise/app/worker/scraper"
	"gitlab.ct.fh-salzburg.ac.at/fhs52920/tradevise/app/worker/store"
)

func RunLiveTicker(rdb *goredis.Client, sym *store.SymbolStore) {
	log.Println("[LiveTicker] started")
	ticker := time.NewTicker(30 * time.Second)
	go runLiveTickerFetchNow(rdb)

	for range ticker.C {
		symbols, err := rdb.SMembers(context.Background(), "active:symbols").Result()
		if err != nil {
			log.Printf("[LiveTicker] failed to get active symbols: %s", err)
			continue
		}
		sym.SetActive(symbols)

		active := sym.GetActive()
		if len(active) == 0 {
			log.Println("[LiveTicker] no active symbols, skipping")
			continue
		}

		log.Printf("[LiveTicker] fetching %d active symbols", len(active))

		for _, symbol := range active {
			if err := publishLivePrice(rdb, symbol); err != nil {
				log.Printf("[LiveTicker] fetch failed for %s: %s", symbol, err)
				time.Sleep(300 * time.Millisecond)
				continue
			}
			time.Sleep(300 * time.Millisecond)
		}
	}
}

func runLiveTickerFetchNow(rdb *goredis.Client) {
	sub := rdb.Subscribe(context.Background(), "stocklive:fetchnow")
	ch := sub.Channel()
	var inFlight sync.Map
	limiter := make(chan struct{}, 2)

	for msg := range ch {
		symbol := msg.Payload
		if symbol == "" {
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

			log.Printf("[LiveTicker] immediate fetch requested for %s", symbol)
			if err := publishLivePrice(rdb, symbol); err != nil {
				log.Printf("[LiveTicker] immediate fetch failed for %s: %s", symbol, err)
			}
		}(symbol)
	}
}

func publishLivePrice(rdb *goredis.Client, symbol string) error {
	price, previousClose, change, changePercent, ts, err := scraper.FetchLivePrice(symbol)
	if err != nil {
		return err
	}
	if price <= 0 {
		return errors.New("invalid live price")
	}

	event := model.LivePriceEvent{
		Symbol:        symbol,
		Price:         price,
		PreviousClose: previousClose,
		Change:        change,
		ChangePercent: changePercent,
		Time:          ts,
	}

	payload, err := json.Marshal(event)
	if err != nil {
		return err
	}

	if err := rdb.Set(context.Background(), "stocklatest:"+symbol, payload, 2*time.Minute).Err(); err != nil {
		return err
	}

	if err := rdb.Publish(context.Background(), "stocklive:"+symbol, payload).Err(); err != nil {
		return err
	}

	log.Printf("[LiveTicker] published %s → %.2f EUR (%+.2f%%)", symbol, price, changePercent)
	return nil
}
