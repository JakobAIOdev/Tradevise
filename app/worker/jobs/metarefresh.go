package jobs

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	goredis "github.com/redis/go-redis/v9"
	"gitlab.ct.fh-salzburg.ac.at/fhs52920/tradevise/app/worker/db"
	"gitlab.ct.fh-salzburg.ac.at/fhs52920/tradevise/app/worker/scraper"
)

func RunMetaRefresh(rdb *goredis.Client, pool *pgxpool.Pool) {
	log.Println("[MetaRefresh] started")
	sub := rdb.Subscribe(context.Background(), "stockmeta:fetchnow")
	ch := sub.Channel()

	for msg := range ch {
		symbol := msg.Payload
		if symbol == "" {
			continue
		}

		log.Printf("[MetaRefresh] immediate fetch requested for %s", symbol)
		if err := refreshMeta(rdb, pool, symbol); err != nil {
			log.Printf("[MetaRefresh] fetch failed for %s: %s", symbol, err)
		}
		time.Sleep(300 * time.Millisecond)
	}
}

func refreshMeta(rdb *goredis.Client, pool *pgxpool.Pool, symbol string) error {
	meta, err := scraper.FetchMeta(symbol)
	if err != nil {
		return err
	}

	if err := db.UpsertStockMeta(pool, meta); err != nil {
		return err
	}

	payload, err := json.Marshal(meta)
	if err != nil {
		return err
	}

	return rdb.Set(context.Background(), "stockmeta:"+symbol, payload, 24*time.Hour).Err()
}
