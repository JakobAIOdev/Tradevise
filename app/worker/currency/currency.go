package converter

import (
	"log"
	"sync"

	"gitlab.ct.fh-salzburg.ac.at/fhs52920/tradevise/app/worker/scraper"
)

type CurrencyConverter struct {
	mu       sync.RWMutex
	usdToEur float64 // 1 USD = x EUR
}

func New() *CurrencyConverter {
	c := &CurrencyConverter{}
	c.Reload()
	return c
}

func (c *CurrencyConverter) Reload() {
	price, _, _, _, _, err := scraper.FetchLivePrice("EURUSD=X")
	if err != nil {
		log.Printf("currency reload failed: %s", err)
		return
	}

	c.mu.Lock()
	c.usdToEur = 1.0 / price
	c.mu.Unlock()

	log.Printf("Currency updated: 1 USD = %.4f EUR", c.usdToEur)
}

func (c *CurrencyConverter) ToEUR(price float64, currency string) float64 {
	if currency == "EUR" {
		return price
	}

	c.mu.RLock()
	defer c.mu.RUnlock()

	if c.usdToEur == 0 {
		return price
	}

	return price * c.usdToEur
}