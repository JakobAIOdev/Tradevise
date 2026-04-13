package db

import (
	"context"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"gitlab.ct.fh-salzburg.ac.at/fhs52920/tradevise/app/worker/config"
	"gitlab.ct.fh-salzburg.ac.at/fhs52920/tradevise/app/worker/model"
)


func New(cfg *config.Config) *pgxpool.Pool {
    pool, err := pgxpool.New(context.Background(), cfg.DatabaseURL)

	if err != nil {
		log.Fatalf("Error connection to DB %s", err)
	}

    return pool
}

func UpsertIntraday(pool *pgxpool.Pool, symbol string, points []model.PricePoint) error {
    for _, p := range points {
        _, err := pool.Exec(context.Background(),
            `INSERT INTO prices_intraday (symbol, time, price)
             VALUES ($1, $2, $3)
             ON CONFLICT (symbol, time) DO NOTHING`,
            symbol,
            time.Unix(p.Time, 0).UTC(),
            p.Price,
        )
        if err != nil {
            return err
        }
    }
    return nil
}

func UpsertWeekly(pool *pgxpool.Pool, symbol string, points []model.PricePoint) error {
    for _, p := range points {
        _, err := pool.Exec(context.Background(),
            `INSERT INTO prices_weekly (symbol, date, price)
             VALUES ($1, $2, $3)
             ON CONFLICT (symbol, date) DO NOTHING`,
            symbol,
            time.Unix(p.Time, 0).UTC(),
            p.Price,
        )
        if err != nil {
            return err
        }
    }
    return nil
}

func SetSymbolDone(pool *pgxpool.Pool, symbol, currency, name string) error {
    _, err := pool.Exec(context.Background(),
        `INSERT INTO tracked_symbols (symbol, currency, name, bootstrap_status, bootstrapped_at)
         VALUES ($1, $2, $3, 'DONE', NOW())
         ON CONFLICT (symbol) DO UPDATE
         SET bootstrap_status = 'DONE',
             currency = $2,
             name = $3,
             bootstrapped_at = NOW()`,
        symbol, currency, name,
    )
    return err
}