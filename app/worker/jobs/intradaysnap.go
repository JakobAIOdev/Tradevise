package jobs

import (
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"gitlab.ct.fh-salzburg.ac.at/fhs52920/tradevise/app/worker/db"
	"gitlab.ct.fh-salzburg.ac.at/fhs52920/tradevise/app/worker/scraper"
	"gitlab.ct.fh-salzburg.ac.at/fhs52920/tradevise/app/worker/store"
)

func RunIntradaySnap(pool *pgxpool.Pool, sym *store.SymbolStore) {
	log.Println("[IntradaySnap] started")
	ticker := time.NewTicker(5 * time.Minute)

	for range ticker.C {
		tracked := sym.GetTracked()

		if len(tracked) == 0 {
			log.Println("[IntradaySnap] no tracked symbols, skipping")
			continue
		}

		log.Printf("[IntradaySnap] fetching %d symbols", len(tracked))

		for symbol := range tracked {
			points, _, err := scraper.FetchIntraday(symbol)
			if err != nil {
				log.Printf("[IntradaySnap] fetch failed for %s: %s", symbol, err)
				if scraper.IsYahooCoolingDownError(err) {
					break
				}
				time.Sleep(300 * time.Millisecond)
				continue
			}

			if err := db.UpsertIntraday(pool, symbol, points); err != nil {
				log.Printf("[IntradaySnap] upsert failed for %s: %s", symbol, err)
				time.Sleep(300 * time.Millisecond)
				continue
			}

			log.Printf("[IntradaySnap] %s -> %d points saved", symbol, len(points))
			time.Sleep(300 * time.Millisecond)
		}
	}
}
