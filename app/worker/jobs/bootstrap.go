package jobs

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	goredis "github.com/redis/go-redis/v9"
	"gitlab.ct.fh-salzburg.ac.at/fhs52920/tradevise/app/worker/db"
	"gitlab.ct.fh-salzburg.ac.at/fhs52920/tradevise/app/worker/model"
	"gitlab.ct.fh-salzburg.ac.at/fhs52920/tradevise/app/worker/scraper"
	"gitlab.ct.fh-salzburg.ac.at/fhs52920/tradevise/app/worker/store"
)

func RunBootstrap(rdb *goredis.Client, pool *pgxpool.Pool, sym *store.SymbolStore) {
    log.Println("[Bootstrap] started")

    for {
        result, err := rdb.BRPop(context.Background(), 0, "bootstrapqueue").Result()
        if err != nil {
            log.Printf("[Bootstrap] BRPOP error: %s", err)
            time.Sleep(2 * time.Second)
            continue
        }

        symbol := result[1]
        log.Printf("[Bootstrap] bootstrapping %s", symbol)

        lockKey := "bootstraplock:" + symbol
		val, err := rdb.SetArgs(context.Background(), lockKey, 1, goredis.SetArgs{
			Mode: "NX",
			TTL:  10 * time.Minute,
		}).Result()

		if err != nil && err != goredis.Nil {
			log.Printf("[Bootstrap] lock error for %s: %s", symbol, err)
			continue
		}
		if val != "OK" {
			log.Printf("[Bootstrap] %s already being bootstrapped, skipping", symbol)
			continue
		}

        if err := bootstrap(rdb, pool, sym, symbol); err != nil {
            log.Printf("[Bootstrap] bootstrap failed for %s: %s", symbol, err)
            rdb.Del(context.Background(), lockKey)
            continue
        }

        rdb.Del(context.Background(), lockKey)
    }
}

func bootstrap(rdb *goredis.Client, pool *pgxpool.Pool, sym *store.SymbolStore, symbol string) error {
    log.Printf("[Bootstrap] fetching intraday 60d for %s", symbol)
    intradayPoints, currency, err := scraper.FetchBootstrapIntraday(symbol)
    if err != nil {
        return err
    }
    time.Sleep(300 * time.Millisecond)

    if err := db.UpsertIntraday(pool, symbol, intradayPoints); err != nil {
        return err
    }
    log.Printf("[Bootstrap] %s intraday done (%d points)", symbol, len(intradayPoints))

    log.Printf("[Bootstrap] fetching weekly history for %s", symbol)
    weeklyPoints, _, err := scraper.FetchBootstrapWeekly(symbol)
    if err != nil {
        return err
    }
    time.Sleep(300 * time.Millisecond)

    if err := db.UpsertWeekly(pool, symbol, weeklyPoints); err != nil {
        return err
    }
    log.Printf("[Bootstrap] %s weekly done (%d points)", symbol, len(weeklyPoints))

    if err := db.SetSymbolDone(pool, symbol, currency, symbol); err != nil {
        return err
    }

    sym.AddTracked(symbol, currency)
    log.Printf("[Bootstrap] %s added to tracked symbols", symbol)

    event := model.LivePriceEvent{
        Symbol:        symbol,
        Time:          time.Now().Unix(),
        BootstrapDone: true,
    }
    payload, _ := json.Marshal(event)
    rdb.Publish(context.Background(), "stocklive:"+symbol, payload)

    log.Printf("[Bootstrap] bootstrap complete for %s", symbol)
    return nil
}