package jobs

import (
	"context"
	"encoding/json"
	"log"
	"time"

	goredis "github.com/redis/go-redis/v9"
	converter "gitlab.ct.fh-salzburg.ac.at/fhs52920/tradevise/app/worker/currency"
	"gitlab.ct.fh-salzburg.ac.at/fhs52920/tradevise/app/worker/model"
	"gitlab.ct.fh-salzburg.ac.at/fhs52920/tradevise/app/worker/scraper"
	"gitlab.ct.fh-salzburg.ac.at/fhs52920/tradevise/app/worker/store"
)

func RunLiveTicker(rdb *goredis.Client, sym *store.SymbolStore, conv *converter.CurrencyConverter) {
    log.Println("[LiveTicker] started")
    ticker := time.NewTicker(30 * time.Second)

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
            price, ts, err := scraper.FetchLivePrice(symbol)
            if err != nil {
                log.Printf("[LiveTicker] fetch failed for %s: %s", symbol, err)
                time.Sleep(300 * time.Millisecond)
                continue
            }

            tracked := sym.GetTracked()
            currency := tracked[symbol]

            priceEUR := conv.ToEUR(price, currency)

            event := model.LivePriceEvent{
                Symbol: symbol,
                Price:  priceEUR,
                Time:   ts,
            }

            payload, err := json.Marshal(event)
            if err != nil {
                log.Printf("[LiveTicker] marshal failed for %s: %s", symbol, err)
                continue
            }

            if err := rdb.Publish(context.Background(), "stocklive:"+symbol, payload).Err(); err != nil {
                log.Printf("[LiveTicker] publish failed for %s: %s", symbol, err)
            } else {
                log.Printf("[LiveTicker] published %s → %.2f EUR", symbol, priceEUR)
            }

            time.Sleep(300 * time.Millisecond)
        }
    }
}