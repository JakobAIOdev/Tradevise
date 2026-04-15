package main

import (
	"log"

	"gitlab.ct.fh-salzburg.ac.at/fhs52920/tradevise/app/worker/config"
	"gitlab.ct.fh-salzburg.ac.at/fhs52920/tradevise/app/worker/db"
	"gitlab.ct.fh-salzburg.ac.at/fhs52920/tradevise/app/worker/jobs"
	redisclient "gitlab.ct.fh-salzburg.ac.at/fhs52920/tradevise/app/worker/redis"
	"gitlab.ct.fh-salzburg.ac.at/fhs52920/tradevise/app/worker/store"
)

func main() {
	cfg := config.Load()
	rdb := redisclient.New(cfg)
	pool := db.New(cfg)
	sym := store.New(pool)

	log.Println("Tradevise Worker starting...")

	go jobs.RunLiveTicker(rdb, sym)
	go jobs.RunBootstrap(rdb, pool, sym)
	go jobs.RunIntradaySnap(pool, sym)
	go jobs.RunWeeklyClose(pool, sym)
	go jobs.RunCleanup(pool)

	select {}
}