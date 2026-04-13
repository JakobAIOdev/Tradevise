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
    BootstrapDone bool    `json:"bootstrapDone,omitempty"`
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