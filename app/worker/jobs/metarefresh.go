package jobs

import (
	"context"
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
		if err := refreshMeta(pool, symbol); err != nil {
			log.Printf("[MetaRefresh] fetch failed for %s: %s", symbol, err)
		}
		time.Sleep(300 * time.Millisecond)
	}
}

func refreshMeta(pool *pgxpool.Pool, symbol string) error {
	meta, err := scraper.FetchMeta(symbol)
	if err != nil {
		return err
	}

	return db.UpsertStockMeta(pool, meta)
}
