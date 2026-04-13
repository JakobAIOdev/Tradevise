package jobs

import (
	"context"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/robfig/cron/v3"
)

func RunCleanup(pool *pgxpool.Pool) {
    log.Println("[Cleanup] started")

    c := cron.New(cron.WithLocation(time.UTC))

    // daily at 03:00 UTC
    c.AddFunc("0 3 * * *", func() {
        runCleanup(pool)
    })

    c.Start()
}

func runCleanup(pool *pgxpool.Pool) {
    log.Println("[Cleanup] deleting intraday data older than 60 days")

    result, err := pool.Exec(context.Background(),
        `DELETE FROM prices_intraday WHERE time < NOW() - INTERVAL '60 days'`,
    )
    if err != nil {
        log.Printf("[Cleanup] failed: %s", err)
        return
    }

    log.Printf("[Cleanup] deleted %d rows", result.RowsAffected())
}