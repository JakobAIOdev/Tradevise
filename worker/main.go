package main

import (
	"log"

	"gitlab.ct.fh-salzburg.ac.at/fhs52920/tradevise/app/worker/scraper"
)

func main() {
    price, ts, err := scraper.FetchLivePrice("AAPL")
    if err != nil {
        log.Fatal(err)
    }
    log.Printf("AAPL: $%.2f at %d", price, ts)
}