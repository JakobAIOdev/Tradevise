package scraper

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"gitlab.ct.fh-salzburg.ac.at/fhs52920/tradevise/app/worker/model"
)

var userAgents = []string{
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/119.0.0.0 Safari/537.36",
	"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/118.0.0.0 Safari/537.36",
}

var httpClient = &http.Client{Timeout: 8 * time.Second}

var yahooCooldownMu sync.Mutex
var yahooCooldownUntil time.Time

const yahooCooldownDuration = 60 * time.Second

var ErrYahooCoolingDown = errors.New("yahoo provider cooldown active")

const minSymbolLengthWithSuffix = 4

var supportedEuroSymbolSuffixes = map[string]bool{
	".DE": true,
	".F":  true,
	".VI": true,
}

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

type yahooCooldownError struct {
	until time.Time
}

func (e yahooCooldownError) Error() string {
	return fmt.Sprintf("%s until %s", ErrYahooCoolingDown, e.until.Format(time.RFC3339))
}

func (e yahooCooldownError) Unwrap() error {
	return ErrYahooCoolingDown
}

func IsYahooCoolingDownError(err error) bool {
	return errors.Is(err, ErrYahooCoolingDown)
}

func IsYahooCoolingDown() bool {
	return yahooCooldownErrorIfActive() != nil
}

func yahooCooldownErrorIfActive() error {
	yahooCooldownMu.Lock()
	defer yahooCooldownMu.Unlock()

	now := time.Now()
	if now.Before(yahooCooldownUntil) {
		return yahooCooldownError{until: yahooCooldownUntil}
	}

	return nil
}

func markYahooCooldown() {
	yahooCooldownMu.Lock()
	defer yahooCooldownMu.Unlock()

	until := time.Now().Add(yahooCooldownDuration)
	if until.After(yahooCooldownUntil) {
		yahooCooldownUntil = until
	}
}

func shouldCooldownYahoo(err error) bool {
	if err == nil {
		return false
	}
	if errors.Is(err, context.DeadlineExceeded) || os.IsTimeout(err) {
		return true
	}

	return strings.Contains(err.Error(), "rate limited")
}

func hasValidYahooSymbolChars(symbol string) bool {
	if len(symbol) < minSymbolLengthWithSuffix {
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

func getSymbolSuffix(symbol string) string {
	suffixStart := strings.LastIndex(symbol, ".")
	if suffixStart == -1 || suffixStart == len(symbol)-1 {
		return ""
	}

	return symbol[suffixStart:]
}

func normalizeSupportedEuroSymbol(symbol string) (string, error) {
	normalized := strings.ToUpper(strings.TrimSpace(symbol))
	if normalized == "" {
		return "", fmt.Errorf("symbol is required")
	}

	suffix := getSymbolSuffix(normalized)
	if !hasValidYahooSymbolChars(normalized) || !supportedEuroSymbolSuffixes[suffix] {
		return "", fmt.Errorf("only supported German or Austrian EUR stock symbols are supported")
	}

	return normalized, nil
}

func ensureEUR(currency, symbol string) error {
	if strings.ToUpper(strings.TrimSpace(currency)) != "EUR" {
		return fmt.Errorf("unsupported currency %q for %s", currency, symbol)
	}

	return nil
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

func fetchYahooChart(ctx context.Context, symbol, query string) (*yahooResponse, error) {
	if err := yahooCooldownErrorIfActive(); err != nil {
		return nil, err
	}

	urls := []string{
		fmt.Sprintf("https://query1.finance.yahoo.com/v8/finance/chart/%s?%s", symbol, query),
		fmt.Sprintf("https://query2.finance.yahoo.com/v8/finance/chart/%s?%s", symbol, query),
	}

	var lastErr error
	for _, url := range urls {
		if err := yahooCooldownErrorIfActive(); err != nil {
			return nil, err
		}

		requestCtx, cancel := context.WithTimeout(ctx, 6*time.Second)
		result, err := fetch(requestCtx, url)
		cancel()

		if err == nil {
			return result, nil
		}
		lastErr = err
		if shouldCooldownYahoo(err) {
			markYahooCooldown()
			return nil, err
		}
	}

	return nil, lastErr
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

func latestPositiveClose(closes []*float64) (float64, bool) {
	for i := len(closes) - 1; i >= 0; i-- {
		if closes[i] != nil && *closes[i] > 0 {
			return *closes[i], true
		}
	}

	return 0, false
}

func FetchLivePrice(symbol string) (price float64, previousClose float64, change float64, changePercent float64, ts int64, err error) {
	symbol, err = normalizeSupportedEuroSymbol(symbol)
	if err != nil {
		return 0, 0, 0, 0, 0, err
	}

	r, err := fetchYahooChart(context.Background(), symbol, "interval=1m&range=1d")
	if err != nil {
		return 0, 0, 0, 0, 0, err
	}

	meta := r.Chart.Result[0].Meta
	if err := ensureEUR(meta.Currency, symbol); err != nil {
		return 0, 0, 0, 0, 0, err
	}

	price = meta.RegularMarketPrice
	if price <= 0 && len(r.Chart.Result[0].Indicators.Quote) > 0 {
		if closePrice, ok := latestPositiveClose(r.Chart.Result[0].Indicators.Quote[0].Close); ok {
			price = closePrice
		}
	}
	if price <= 0 {
		return 0, 0, 0, 0, 0, fmt.Errorf("no positive live price for %s", symbol)
	}

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
	symbol, err := normalizeSupportedEuroSymbol(symbol)
	if err != nil {
		return nil, "", err
	}

	r, err := fetchYahooChart(context.Background(), symbol, fmt.Sprintf("interval=5m&range=%s", rangeParam))
	if err != nil {
		return nil, "", err
	}

	result := r.Chart.Result[0]
	if err := ensureEUR(result.Meta.Currency, symbol); err != nil {
		return nil, "", err
	}

	points := parsePoints(result.Timestamp, result.Indicators.Quote[0].Close)

	return points, result.Meta.Currency, nil
}

func FetchBootstrapWeekly(symbol string) ([]model.PricePoint, string, error) {
	symbol, err := normalizeSupportedEuroSymbol(symbol)
	if err != nil {
		return nil, "", err
	}

	r, err := fetchYahooChart(context.Background(), symbol, "interval=1wk&period1=0&period2=9999999999")
	if err != nil {
		return nil, "", err
	}

	result := r.Chart.Result[0]
	if err := ensureEUR(result.Meta.Currency, symbol); err != nil {
		return nil, "", err
	}

	points := parsePoints(result.Timestamp, result.Indicators.Quote[0].Close)

	return points, result.Meta.Currency, nil
}

func FetchMeta(symbol string) (model.StockMeta, error) {
	symbol, err := normalizeSupportedEuroSymbol(symbol)
	if err != nil {
		return model.StockMeta{}, err
	}

	r, err := fetchYahooChart(context.Background(), symbol, "interval=1m&range=1d")
	if err != nil {
		return model.StockMeta{}, err
	}

	m := r.Chart.Result[0].Meta
	if err := ensureEUR(m.Currency, symbol); err != nil {
		return model.StockMeta{}, err
	}

	meta := model.StockMeta{
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
	}
	return meta, nil
}
