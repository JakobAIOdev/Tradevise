package main

import (
	"log"

	"gitlab.ct.fh-salzburg.ac.at/fhs52920/tradevise/app/worker/config"
	"gitlab.ct.fh-salzburg.ac.at/fhs52920/tradevise/app/worker/db"
	"gitlab.ct.fh-salzburg.ac.at/fhs52920/tradevise/app/worker/jobs"
	redisclient "gitlab.ct.fh-salzburg.ac.at/fhs52920/tradevise/app/worker/redis"
)

func main() {
	cfg := config.Load()
	rdb := redisclient.New(cfg)
	pool := db.New(cfg)

	log.Println("Tradevise Worker starting...")

	go jobs.RunLiveTicker(rdb, pool)
	go jobs.RunCleanup(pool)

	select {}
}
