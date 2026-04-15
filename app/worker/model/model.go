package model

import "time"

type PriceIntraday struct {
	Symbol string
	Time   time.Time
	Price  float64
}

type PriceWeekly struct {
	Symbol string
	Date   time.Time
	Price  float64
}

type TrackedSymbol struct {
	Symbol          string
	Name            string
	Currency        string
	BootstrapStatus string // PENDING | BOOTSTRAPPING | DONE | FAILED
	BootstrappedAt  *time.Time
}

// Redis Payload
type LivePriceEvent struct {
	Symbol        string  `json:"symbol"`
	Price         float64 `json:"price"`
	Time          int64   `json:"time"`
	PreviousClose float64 `json:"previousClose,omitempty"`
	Change        float64 `json:"change,omitempty"`
	ChangePercent float64 `json:"changePercent,omitempty"`
	BootstrapDone bool    `json:"bootstrapDone,omitempty"`
}

type StockMeta struct {
	Symbol           string  `json:"symbol"`
	Name             string  `json:"name"`
	Currency         string  `json:"currency"`
	Exchange         string  `json:"exchange"`
	PreviousClose    float64 `json:"previousClose"`
	DayHigh          float64 `json:"dayHigh"`
	DayLow           float64 `json:"dayLow"`
	FiftyTwoWeekHigh float64 `json:"fiftyTwoWeekHigh"`
	FiftyTwoWeekLow  float64 `json:"fiftyTwoWeekLow"`
	Volume           int     `json:"volume"`
}

// Scraper intern
type PricePoint struct {
	Time  int64
	Price float64
}

type FetchResult struct {
	Symbol string
	Meta   struct {
		RegularMarketPrice float64
		Currency           string
	}
	Points []PricePoint
}
