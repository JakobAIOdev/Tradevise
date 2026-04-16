package db

import (
	"context"
	"fmt"
	"log"
	"strings"
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
	return upsertIntradayPoints(context.Background(), pool, symbol, points)
}

func UpsertDaily(pool *pgxpool.Pool, symbol string, points []model.PricePoint) error {
	return upsertDailyPoints(context.Background(), pool, symbol, points)
}

func UpsertTrackedSymbol(pool *pgxpool.Pool, symbol, currency, name string) error {
	_, err := pool.Exec(context.Background(),
		`INSERT INTO tracked_symbols (symbol, currency, name)
         VALUES ($1, $2, $3)
         ON CONFLICT (symbol) DO UPDATE
         SET currency = $2,
             name = $3`,
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

func LoadPortfolioSymbols(pool *pgxpool.Pool) ([]string, error) {
	rows, err := pool.Query(context.Background(),
		`SELECT DISTINCT symbol
         FROM "PortfolioHolding"
         ORDER BY symbol ASC`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	symbols := make([]string, 0)
	for rows.Next() {
		var symbol string
		if err := rows.Scan(&symbol); err != nil {
			return nil, err
		}
		symbols = append(symbols, symbol)
	}

	return symbols, rows.Err()
}

func upsertIntradayPoints(ctx context.Context, pool *pgxpool.Pool, symbol string, points []model.PricePoint) error {
	if len(points) == 0 {
		return nil
	}

	args := make([]any, 0, len(points)*3)
	placeholders := make([]string, 0, len(points))

	for index, point := range points {
		base := index * 3
		placeholders = append(placeholders, fmt.Sprintf("($%d, $%d, $%d)", base+1, base+2, base+3))
		args = append(args, symbol, time.Unix(point.Time, 0).UTC(), point.Price)
	}

	query := `INSERT INTO prices_intraday (symbol, time, price)
		VALUES ` + strings.Join(placeholders, ",") + `
		ON CONFLICT (symbol, time) DO NOTHING`

	_, err := pool.Exec(ctx, query, args...)
	return err
}

func upsertDailyPoints(ctx context.Context, pool *pgxpool.Pool, symbol string, points []model.PricePoint) error {
	if len(points) == 0 {
		return nil
	}

	args := make([]any, 0, len(points)*3)
	placeholders := make([]string, 0, len(points))

	for index, point := range points {
		base := index * 3
		placeholders = append(placeholders, fmt.Sprintf("($%d, $%d, $%d)", base+1, base+2, base+3))
		args = append(args, symbol, time.Unix(point.Time, 0).UTC(), point.Price)
	}

	query := `INSERT INTO prices_daily (symbol, date, price)
		VALUES ` + strings.Join(placeholders, ",") + `
		ON CONFLICT (symbol, date) DO NOTHING`

	_, err := pool.Exec(ctx, query, args...)
	return err
}
