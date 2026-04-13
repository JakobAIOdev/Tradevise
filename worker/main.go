package main

import (
	"log"

	"github.com/robfig/cron/v3"
	converter "gitlab.ct.fh-salzburg.ac.at/fhs52920/tradevise/app/worker/currency"
	"gitlab.ct.fh-salzburg.ac.at/fhs52920/tradevise/app/worker/scraper"
)

func main() {
	conv := converter.New()

	// daily chronjob refetch at 03:00 UTC 
	c := cron.New()
	c.AddFunc("0 3 * * *", func() {
		conv.Reload()
	})
	c.Start()

	
    price, ts, err := scraper.FetchLivePrice("AAPL")
    if err != nil {
        log.Fatal(err)
    }

	priceEUR := conv.ToEUR(price, "USD")
    log.Printf("AAPL: %.2f€ at %d", priceEUR, ts)
}