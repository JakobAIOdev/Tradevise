package scraper

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"strings"
	"time"

	"gitlab.ct.fh-salzburg.ac.at/fhs52920/tradevise/app/worker/model"
)

var userAgents = []string{
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/119.0.0.0 Safari/537.36",
	"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/118.0.0.0 Safari/537.36",
}

var httpClient = &http.Client{Timeout: 10 * time.Second}

const xetraSymbolSuffix = ".DE"

type yahooResponse struct {
	Chart struct {
		Result []struct {
			Meta struct {
				Currency             string  `json:"currency"`
				Symbol               string  `json:"symbol"`
				RegularMarketPrice   float64 `json:"regularMarketPrice"`
				LongName             string  `json:"longName"`
				ShortName            string  `json:"shortName"`
				ExchangeName         string  `json:"exchangeName"`
				FullExchangeName     string  `json:"fullExchangeName"`
				InstrumentType       string  `json:"instrumentType"`
				Timezone             string  `json:"timezone"`
				ExchangeTimezoneName string  `json:"exchangeTimezoneName"`
				RegularMarketVolume  int     `json:"regularMarketVolume"`
				FiftyTwoWeekHigh     float64 `json:"fiftyTwoWeekHigh"`
				FiftyTwoWeekLow      float64 `json:"fiftyTwoWeekLow"`
				RegularMarketDayHigh float64 `json:"regularMarketDayHigh"`
				RegularMarketDayLow  float64 `json:"regularMarketDayLow"`
				ChartPreviousClose   float64 `json:"chartPreviousClose"`
				DataGranularity      string  `json:"dataGranularity"`
			} `json:"meta"`
			Timestamp  []int64 `json:"timestamp"`
			Indicators struct {
				Quote []struct {
					Volume []*int     `json:"volume"`
					Close  []*float64 `json:"close"`
					Open   []*float64 `json:"open"`
					Low    []*float64 `json:"low"`
					High   []*float64 `json:"high"`
				} `json:"quote"`
			} `json:"indicators"`
		} `json:"result"`
		Error interface{} `json:"error"`
	} `json:"chart"`
}

func hasValidYahooSymbolChars(symbol string) bool {
	if len(symbol) <= len(xetraSymbolSuffix) {
		return false
	}

	for _, char := range symbol {
		isDigit := char >= '0' && char <= '9'
		isUppercaseLetter := char >= 'A' && char <= 'Z'
		if !isDigit && !isUppercaseLetter && char != '.' && char != '-' {
			return false
		}
	}

	return true
}

func normalizeXetraSymbol(symbol string) (string, error) {
	normalized := strings.ToUpper(strings.TrimSpace(symbol))
	if normalized == "" {
		return "", fmt.Errorf("symbol is required")
	}
	if !hasValidYahooSymbolChars(normalized) || !strings.HasSuffix(normalized, xetraSymbolSuffix) {
		return "", fmt.Errorf("only Xetra stock symbols ending in .DE are supported")
	}

	return normalized, nil
}

func fetch(ctx context.Context, url string) (*yahooResponse, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("User-Agent", userAgents[rand.Intn(len(userAgents))])
	req.Header.Set("Referer", "https://finance.yahoo.com")

	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == 429 {
		return nil, fmt.Errorf("rate limited (429)")
	}
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("unexpected status: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var result yahooResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, err
	}

	if len(result.Chart.Result) == 0 {
		return nil, fmt.Errorf("no result for symbol")
	}

	return &result, nil
}

func parsePoints(timestamps []int64, closes []*float64) []model.PricePoint {
	points := make([]model.PricePoint, 0, len(timestamps))
	for i, ts := range timestamps {
		if i >= len(closes) || closes[i] == nil {
			continue
		}
		points = append(points, model.PricePoint{
			Time:  ts,
			Price: *closes[i],
		})
	}
	return points
}

func FetchLivePrice(symbol string) (price float64, previousClose float64, change float64, changePercent float64, ts int64, err error) {
	symbol, err = normalizeXetraSymbol(symbol)
	if err != nil {
		return 0, 0, 0, 0, 0, err
	}

	url := fmt.Sprintf(
		"https://query1.finance.yahoo.com/v8/finance/chart/%s?interval=1m&range=1d",
		symbol,
	)

	r, err := fetch(context.Background(), url)
	if err != nil {
		return 0, 0, 0, 0, 0, err
	}

	meta := r.Chart.Result[0].Meta
	price = meta.RegularMarketPrice
	previousClose = meta.ChartPreviousClose
	change = price - previousClose
	if previousClose != 0 {
		changePercent = (change / previousClose) * 100
	}
	ts = time.Now().Unix()

	return price, previousClose, change, changePercent, ts, nil
}

func FetchIntraday(symbol string) ([]model.PricePoint, string, error) {
	return fetchIntraday5m(symbol, "1d")
}

func FetchBootstrapIntraday(symbol string) ([]model.PricePoint, string, error) {
	return fetchIntraday5m(symbol, "60d")
}

func fetchIntraday5m(symbol, rangeParam string) ([]model.PricePoint, string, error) {
	symbol, err := normalizeXetraSymbol(symbol)
	if err != nil {
		return nil, "", err
	}

	url := fmt.Sprintf(
		"https://query1.finance.yahoo.com/v8/finance/chart/%s?interval=5m&range=%s",
		symbol, rangeParam,
	)

	r, err := fetch(context.Background(), url)
	if err != nil {
		return nil, "", err
	}

	result := r.Chart.Result[0]
	points := parsePoints(result.Timestamp, result.Indicators.Quote[0].Close)

	return points, result.Meta.Currency, nil
}

func FetchBootstrapWeekly(symbol string) ([]model.PricePoint, string, error) {
	symbol, err := normalizeXetraSymbol(symbol)
	if err != nil {
		return nil, "", err
	}

	url := fmt.Sprintf(
		"https://query1.finance.yahoo.com/v8/finance/chart/%s?interval=1wk&period1=0&period2=9999999999",
		symbol,
	)

	r, err := fetch(context.Background(), url)
	if err != nil {
		return nil, "", err
	}

	result := r.Chart.Result[0]
	points := parsePoints(result.Timestamp, result.Indicators.Quote[0].Close)

	return points, result.Meta.Currency, nil
}

func FetchMeta(symbol string) (model.StockMeta, error) {
	symbol, err := normalizeXetraSymbol(symbol)
	if err != nil {
		return model.StockMeta{}, err
	}

	url := fmt.Sprintf(
		"https://query1.finance.yahoo.com/v8/finance/chart/%s?interval=1m&range=1d",
		symbol,
	)

	r, err := fetch(context.Background(), url)
	if err != nil {
		return model.StockMeta{}, err
	}

	m := r.Chart.Result[0].Meta

	return model.StockMeta{
		Symbol:           m.Symbol,
		Name:             m.LongName,
		Currency:         m.Currency,
		Exchange:         m.FullExchangeName,
		PreviousClose:    m.ChartPreviousClose,
		DayHigh:          m.RegularMarketDayHigh,
		DayLow:           m.RegularMarketDayLow,
		FiftyTwoWeekHigh: m.FiftyTwoWeekHigh,
		FiftyTwoWeekLow:  m.FiftyTwoWeekLow,
		Volume:           m.RegularMarketVolume,
	}, nil
}
