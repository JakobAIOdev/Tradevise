package store

import (
	"context"
	"log"
	"sync"

	"github.com/jackc/pgx/v5/pgxpool"
)

type SymbolStore struct {
    mu      sync.RWMutex
    tracked map[string]string
    active  map[string]bool
}

func New(pool *pgxpool.Pool) *SymbolStore {
    s := &SymbolStore{
        tracked: make(map[string]string),
        active:  make(map[string]bool),
    }
    s.LoadFromDB(pool)
    return s
}

func (s *SymbolStore) LoadFromDB(pool *pgxpool.Pool) {
    rows, err := pool.Query(context.Background(),
        `SELECT symbol, COALESCE(currency, 'USD') FROM tracked_symbols WHERE bootstrap_status = 'DONE'`,
    )
    if err != nil {
        log.Printf("SymbolStore: failed to load from DB: %s", err)
        return
    }
    defer rows.Close()

    s.mu.Lock()
    defer s.mu.Unlock()

    for rows.Next() {
        var symbol, currency string
        if err := rows.Scan(&symbol, &currency); err != nil {
            continue
        }
        s.tracked[symbol] = currency
    }

    log.Printf("SymbolStore: loaded %d tracked symbols from DB", len(s.tracked))
}

// --- Tracked ---
func (s *SymbolStore) AddTracked(symbol, currency string) {
    s.mu.Lock()
    defer s.mu.Unlock()
    s.tracked[symbol] = currency
}

func (s *SymbolStore) GetTracked() map[string]string {
    s.mu.RLock()
    defer s.mu.RUnlock()
    copy := make(map[string]string, len(s.tracked))
    for k, v := range s.tracked {
        copy[k] = v
    }
    return copy
}

func (s *SymbolStore) IsTracked(symbol string) bool {
    s.mu.RLock()
    defer s.mu.RUnlock()
    _, ok := s.tracked[symbol]
    return ok
}

// --- Active ---
func (s *SymbolStore) SetActive(symbols []string) {
    s.mu.Lock()
    defer s.mu.Unlock()
    s.active = make(map[string]bool, len(symbols))
    for _, sym := range symbols {
        s.active[sym] = true
    }
}

func (s *SymbolStore) GetActive() []string {
    s.mu.RLock()
    defer s.mu.RUnlock()
    result := make([]string, 0, len(s.active))
    for sym := range s.active {
        result = append(result, sym)
    }
    return result
}