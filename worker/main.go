package main

import (
	"log"

	"github.com/robfig/cron/v3"
	"gitlab.ct.fh-salzburg.ac.at/fhs52920/tradevise/app/worker/config"
	converter "gitlab.ct.fh-salzburg.ac.at/fhs52920/tradevise/app/worker/currency"
	"gitlab.ct.fh-salzburg.ac.at/fhs52920/tradevise/app/worker/db"
	"gitlab.ct.fh-salzburg.ac.at/fhs52920/tradevise/app/worker/jobs"
	redisclient "gitlab.ct.fh-salzburg.ac.at/fhs52920/tradevise/app/worker/redis"
	"gitlab.ct.fh-salzburg.ac.at/fhs52920/tradevise/app/worker/store"
)

func main() {
    cfg  := config.Load()
    rdb  := redisclient.New(cfg)
    pool := db.New(cfg)
    sym  := store.New(pool)
    conv := converter.New()

    c := cron.New()
    c.AddFunc("0 3 * * *", func() { conv.Reload() })
    c.Start()

    log.Println("Tradevise Worker starting...")

    go jobs.RunLiveTicker(rdb, sym, conv)

    select{}
}