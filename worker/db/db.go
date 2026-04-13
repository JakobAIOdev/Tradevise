package db

import (
	"context"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
	"gitlab.ct.fh-salzburg.ac.at/fhs52920/tradevise/app/worker/config"
)


func New(cfg *config.Config) *pgxpool.Pool {
    pool, err := pgxpool.New(context.Background(), cfg.DatabaseURL)

	if err != nil {
		log.Fatalf("Error connection to DB %s", err)
	}

    return pool
}