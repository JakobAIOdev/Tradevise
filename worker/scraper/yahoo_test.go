package scraper

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestParsePointsSkipsMissingCloseValues(t *testing.T) {
	a := 10.5
	b := 12.75

	got := parsePoints(
		[]int64{100, 200, 300, 400},
		[]*float64{&a, nil, &b},
	)

	if len(got) != 2 {
		t.Fatalf("len(parsePoints()) = %d, want %d", len(got), 2)
	}
	if got[0].Time != 100 || got[0].Price != 10.5 {
		t.Fatalf("point[0] = %+v, want time 100 and price 10.5", got[0])
	}
	if got[1].Time != 300 || got[1].Price != 12.75 {
		t.Fatalf("point[1] = %+v, want time 300 and price 12.75", got[1])
	}
}

func TestFetchDecodesYahooResponse(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("Referer") != "https://finance.yahoo.com" {
			t.Fatalf("Referer header = %q, want %q", r.Header.Get("Referer"), "https://finance.yahoo.com")
		}
		if r.Header.Get("User-Agent") == "" {
			t.Fatal("User-Agent header is empty")
		}

		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{
			"chart": {
				"result": [{
					"meta": {
						"currency": "USD",
						"symbol": "AAPL",
						"regularMarketPrice": 195.25
					},
					"timestamp": [1, 2],
					"indicators": {
						"quote": [{
							"close": [195.25, 196.5]
						}]
					}
				}],
				"error": null
			}
		}`))
	}))
	defer server.Close()

	oldClient := httpClient
	httpClient = server.Client()
	t.Cleanup(func() { httpClient = oldClient })

	got, err := fetch(context.Background(), server.URL)
	if err != nil {
		t.Fatalf("fetch() returned error: %v", err)
	}

	result := got.Chart.Result[0]
	if result.Meta.Symbol != "AAPL" {
		t.Fatalf("symbol = %q, want %q", result.Meta.Symbol, "AAPL")
	}
	if result.Meta.Currency != "USD" {
		t.Fatalf("currency = %q, want %q", result.Meta.Currency, "USD")
	}
	if result.Meta.RegularMarketPrice != 195.25 {
		t.Fatalf("regularMarketPrice = %v, want %v", result.Meta.RegularMarketPrice, 195.25)
	}
}

func TestFetchRejectsUnexpectedStatuses(t *testing.T) {
	tests := []struct {
		name       string
		statusCode int
		wantErr    string
	}{
		{name: "rate limit", statusCode: http.StatusTooManyRequests, wantErr: "rate limited (429)"},
		{name: "server error", statusCode: http.StatusInternalServerError, wantErr: "unexpected status: 500"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(tt.statusCode)
			}))
			defer server.Close()

			oldClient := httpClient
			httpClient = server.Client()
			t.Cleanup(func() { httpClient = oldClient })

			_, err := fetch(context.Background(), server.URL)
			if err == nil {
				t.Fatal("fetch() returned nil error")
			}
			if err.Error() != tt.wantErr {
				t.Fatalf("fetch() error = %q, want %q", err.Error(), tt.wantErr)
			}
		})
	}
}

func TestFetchReturnsErrorWhenResultIsEmpty(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"chart":{"result":[],"error":null}}`))
	}))
	defer server.Close()

	oldClient := httpClient
	httpClient = &http.Client{Transport: server.Client().Transport, Timeout: time.Second}
	t.Cleanup(func() { httpClient = oldClient })

	_, err := fetch(context.Background(), server.URL)
	if err == nil {
		t.Fatal("fetch() returned nil error")
	}
	if err.Error() != "no result for symbol" {
		t.Fatalf("fetch() error = %q, want %q", err.Error(), "no result for symbol")
	}
}
