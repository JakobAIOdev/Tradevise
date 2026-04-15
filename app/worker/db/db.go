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

func UpsertStockMeta(pool *pgxpool.Pool, meta model.StockMeta) error {
	_, err := pool.Exec(context.Background(),
		`INSERT INTO stock_meta (
		     symbol,
		     name,
		     currency,
		     exchange,
		     previous_close,
		     day_high,
		     day_low,
		     fifty_two_week_high,
		     fifty_two_week_low,
		     volume,
		     updated_at
		 )
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
		 ON CONFLICT (symbol) DO UPDATE
		 SET name = EXCLUDED.name,
		     currency = EXCLUDED.currency,
		     exchange = EXCLUDED.exchange,
		     previous_close = EXCLUDED.previous_close,
		     day_high = EXCLUDED.day_high,
		     day_low = EXCLUDED.day_low,
		     fifty_two_week_high = EXCLUDED.fifty_two_week_high,
		     fifty_two_week_low = EXCLUDED.fifty_two_week_low,
		     volume = EXCLUDED.volume,
		     updated_at = NOW()`,
		meta.Symbol,
		meta.Name,
		meta.Currency,
		meta.Exchange,
		meta.PreviousClose,
		meta.DayHigh,
		meta.DayLow,
		meta.FiftyTwoWeekHigh,
		meta.FiftyTwoWeekLow,
		meta.Volume,
	)
	return err
}
