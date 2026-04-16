package scraper

import (
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func TestParseSeriesPointsSkipsInvalidValues(t *testing.T) {
	got := parseSeriesPoints([][2]float64{
		{100000, 10.5},
		{200000, 0},
		{0, 11.25},
		{300000, 12.75},
	})

	if len(got) != 2 {
		t.Fatalf("len(parseSeriesPoints()) = %d, want %d", len(got), 2)
	}
	if got[0].Time != 100 || got[0].Price != 10.5 {
		t.Fatalf("point[0] = %+v, want time 100 and price 10.5", got[0])
	}
	if got[1].Time != 300 || got[1].Price != 12.75 {
		t.Fatalf("point[1] = %+v, want time 300 and price 12.75", got[1])
	}
}

func TestLatestPositivePointUsesLastValidPoint(t *testing.T) {
	got, ok := latestPositivePoint(parseSeriesPoints([][2]float64{
		{100000, 10.5},
		{200000, 0},
		{300000, 12.75},
	}))
	if !ok {
		t.Fatal("latestPositivePoint() ok = false, want true")
	}
	if got.Time != 300 || got.Price != 12.75 {
		t.Fatalf("latestPositivePoint() = %+v, want time 300 and price 12.75", got)
	}
}

func TestLatestPositivePointRejectsMissingPrices(t *testing.T) {
	got, ok := latestPositivePoint(parseSeriesPoints([][2]float64{
		{100000, 0},
		{0, 12.75},
	}))
	if ok {
		t.Fatal("latestPositivePoint() ok = true, want false")
	}
	if got.Time != 0 || got.Price != 0 {
		t.Fatalf("latestPositivePoint() = %+v, want zero point", got)
	}
}

func TestFetchJSONDecodesLangSchwarzResponse(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("Referer") != "https://www.ls-tc.de/" {
			t.Fatalf("Referer header = %q, want %q", r.Header.Get("Referer"), "https://www.ls-tc.de/")
		}
		if r.Header.Get("Accept") != "application/json" {
			t.Fatalf("Accept header = %q, want application/json", r.Header.Get("Accept"))
		}
		if r.Header.Get("User-Agent") == "" {
			t.Fatal("User-Agent header is empty")
		}

		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{
			"info": {
				"isin": "US0378331005",
				"plotlines": [{"id": "previousDay", "value": 194.27}]
			},
			"series": {
				"intraday": {"data": [[1712576400000, 195.25]]},
				"history": {"name": "Apple Inc.", "data": [[1712490000000, 194.27]]}
			}
		}`))
	}))
	defer server.Close()

	oldClient := httpClient
	httpClient = server.Client()
	t.Cleanup(func() { httpClient = oldClient })

	var got langSchwarzChartResponse
	if err := fetchJSON(context.Background(), server.URL, &got); err != nil {
		t.Fatalf("fetchJSON() returned error: %v", err)
	}

	if got.Info.ISIN != "US0378331005" {
		t.Fatalf("ISIN = %q, want %q", got.Info.ISIN, "US0378331005")
	}
	if got.Series.History.Name != "Apple Inc." {
		t.Fatalf("history name = %q, want Apple Inc.", got.Series.History.Name)
	}
	if len(got.Series.Intraday.Data) != 1 {
		t.Fatalf("intraday data len = %d, want 1", len(got.Series.Intraday.Data))
	}
}

func TestFetchJSONRejectsUnexpectedStatuses(t *testing.T) {
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

			var got langSchwarzChartResponse
			err := fetchJSON(context.Background(), server.URL, &got)
			if err == nil {
				t.Fatal("fetchJSON() returned nil error")
			}
			if err.Error() != tt.wantErr {
				t.Fatalf("fetchJSON() error = %q, want %q", err.Error(), tt.wantErr)
			}
		})
	}
}

func TestFetchChartReturnsErrorWhenSeriesAreEmpty(t *testing.T) {
	resetInstrumentCache()

	oldClient := httpClient
	httpClient = &http.Client{
		Transport: roundTripFunc(func(r *http.Request) (*http.Response, error) {
			if strings.Contains(r.URL.Path, "/instrument/search/main") {
				return jsonResponse(r, `[{
					"id": 41780,
					"instrumentId": 41780,
					"displayname": "Apple Inc.",
					"isin": "US0378331005",
					"categorySymbol": "STK"
				}]`), nil
			}

			return jsonResponse(r, `{
				"info": {"isin": "US0378331005"},
				"series": {
					"intraday": {"data": []},
					"history": {"data": []}
				}
			}`), nil
		}),
		Timeout: time.Second,
	}
	t.Cleanup(func() { httpClient = oldClient })

	_, _, err := fetchChart(context.Background(), "US0378331005")
	if err == nil {
		t.Fatal("fetchChart() returned nil error")
	}
	if err.Error() != "no chart data for US0378331005" {
		t.Fatalf("fetchChart() error = %q, want no chart data", err.Error())
	}
}

func TestNormalizeLangSchwarzSymbolAcceptsISIN(t *testing.T) {
	got, err := normalizeLangSchwarzSymbol(" us0378331005 ")
	if err != nil {
		t.Fatalf("normalizeLangSchwarzSymbol() returned error: %v", err)
	}
	if got != "US0378331005" {
		t.Fatalf("normalizeLangSchwarzSymbol() = %q, want %q", got, "US0378331005")
	}
}

func TestNormalizeLangSchwarzSymbolRejectsUnsupportedSymbols(t *testing.T) {
	_, err := normalizeLangSchwarzSymbol("APPLE")
	if err == nil {
		t.Fatal("normalizeLangSchwarzSymbol() returned nil error")
	}
	if err.Error() != "only Lang & Schwarz EUR instruments identified by ISIN are supported" {
		t.Fatalf("normalizeLangSchwarzSymbol() error = %q, want ISIN support error", err.Error())
	}
}

func TestFetchMetaMapsLangSchwarzData(t *testing.T) {
	resetInstrumentCache()

	oldClient := httpClient
	httpClient = &http.Client{
		Transport: roundTripFunc(func(r *http.Request) (*http.Response, error) {
			if r.Header.Get("Referer") != "https://www.ls-tc.de/" {
				t.Fatalf("Referer header = %q, want %q", r.Header.Get("Referer"), "https://www.ls-tc.de/")
			}
			if r.Header.Get("User-Agent") == "" {
				t.Fatal("User-Agent header is empty")
			}

			switch {
			case strings.Contains(r.URL.Path, "/instrument/search/main"):
				if r.URL.Query().Get("q") != "US0378331005" {
					t.Fatalf("search q = %q, want US0378331005", r.URL.Query().Get("q"))
				}
				return jsonResponse(r, `[{
					"id": 41780,
					"instrumentId": 41780,
					"displayname": "Apple Inc.",
					"isin": "US0378331005",
					"categorySymbol": "STK"
				}]`), nil
			case strings.Contains(r.URL.Path, "/instrument/chart/dataForInstrument"):
				if r.URL.Query().Get("instrumentId") != "41780" {
					t.Fatalf("instrumentId = %q, want 41780", r.URL.Query().Get("instrumentId"))
				}
				if r.URL.Query().Get("marketId") != "1" {
					t.Fatalf("marketId = %q, want 1", r.URL.Query().Get("marketId"))
				}
				if r.URL.Query().Get("quotetype") != "mid" {
					t.Fatalf("quotetype = %q, want mid", r.URL.Query().Get("quotetype"))
				}

				return jsonResponse(r, `{
					"info": {
						"isin": "US0378331005",
						"plotlines": [{"id": "previousDay", "label": "Vortag 194,270", "value": 194.27}]
					},
					"series": {
						"intraday": {
							"data": [
								[1712576400000, 195.25],
								[1712580000000, 198.12],
								[1712583600000, 193.45]
							]
						},
						"history": {
							"name": "Apple Inc.",
							"data": [
								[1681084800000, 164.08],
								[1700000000000, 237.49],
								[1712583600000, 193.45]
							]
						}
					}
				}`), nil
			default:
				t.Fatalf("unexpected request URL: %s", r.URL.String())
			}

			return nil, nil
		}),
	}
	t.Cleanup(func() { httpClient = oldClient })

	got, err := FetchMeta("US0378331005")
	if err != nil {
		t.Fatalf("FetchMeta() returned error: %v", err)
	}

	if got.Symbol != "US0378331005" {
		t.Fatalf("Symbol = %q, want %q", got.Symbol, "US0378331005")
	}
	if got.Name != "Apple Inc." {
		t.Fatalf("Name = %q, want %q", got.Name, "Apple Inc.")
	}
	if got.Currency != "EUR" {
		t.Fatalf("Currency = %q, want %q", got.Currency, "EUR")
	}
	if got.Exchange != "Lang & Schwarz" {
		t.Fatalf("Exchange = %q, want %q", got.Exchange, "Lang & Schwarz")
	}
	if got.PreviousClose != 194.27 {
		t.Fatalf("PreviousClose = %v, want %v", got.PreviousClose, 194.27)
	}
	if got.DayHigh != 198.12 {
		t.Fatalf("DayHigh = %v, want %v", got.DayHigh, 198.12)
	}
	if got.DayLow != 193.45 {
		t.Fatalf("DayLow = %v, want %v", got.DayLow, 193.45)
	}
	if got.FiftyTwoWeekHigh != 237.49 {
		t.Fatalf("FiftyTwoWeekHigh = %v, want %v", got.FiftyTwoWeekHigh, 237.49)
	}
	if got.FiftyTwoWeekLow != 164.08 {
		t.Fatalf("FiftyTwoWeekLow = %v, want %v", got.FiftyTwoWeekLow, 164.08)
	}
	if got.Volume != 0 {
		t.Fatalf("Volume = %d, want 0", got.Volume)
	}
}

func resetInstrumentCache() {
	instrumentCache.Lock()
	defer instrumentCache.Unlock()
	instrumentCache.byISIN = make(map[string]langSchwarzInstrument)
}

func jsonResponse(r *http.Request, body string) *http.Response {
	return &http.Response{
		StatusCode: http.StatusOK,
		Header:     make(http.Header),
		Body:       io.NopCloser(strings.NewReader(body)),
		Request:    r,
	}
}

type roundTripFunc func(*http.Request) (*http.Response, error)

func (f roundTripFunc) RoundTrip(r *http.Request) (*http.Response, error) {
	return f(r)
}
