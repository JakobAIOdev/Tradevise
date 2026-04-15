package jobs

import (
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/robfig/cron/v3"
	"gitlab.ct.fh-salzburg.ac.at/fhs52920/tradevise/app/worker/db"
	"gitlab.ct.fh-salzburg.ac.at/fhs52920/tradevise/app/worker/scraper"
	"gitlab.ct.fh-salzburg.ac.at/fhs52920/tradevise/app/worker/store"
)

func RunWeeklyClose(pool *pgxpool.Pool, sym *store.SymbolStore) {
	log.Println("[WeeklyClose] started")

	c := cron.New(cron.WithLocation(time.UTC))

	// Every Monday at 06:00 UTC
	c.AddFunc("0 6 * * 1", func() {
		runWeeklyClose(pool, sym)
	})

	c.Start()
}

func runWeeklyClose(pool *pgxpool.Pool, sym *store.SymbolStore) {
	tracked := sym.GetTracked()

	if len(tracked) == 0 {
		log.Println("[WeeklyClose] no tracked symbols, skipping")
		return
	}

	log.Printf("[WeeklyClose] updating %d symbols", len(tracked))

	for symbol := range tracked {
		points, _, err := scraper.FetchBootstrapWeekly(symbol)
		if err != nil {
			log.Printf("[WeeklyClose] fetch failed for %s: %s", symbol, err)
			if scraper.IsYahooCoolingDownError(err) {
				break
			}
			time.Sleep(300 * time.Millisecond)
			continue
		}

		if err := db.UpsertWeekly(pool, symbol, points); err != nil {
			log.Printf("[WeeklyClose] upsert failed for %s: %s", symbol, err)
			time.Sleep(300 * time.Millisecond)
			continue
		}

		log.Printf("[WeeklyClose] %s → %d points saved", symbol, len(points))
		time.Sleep(300 * time.Millisecond)
	}

	log.Println("[WeeklyClose] done")
}
