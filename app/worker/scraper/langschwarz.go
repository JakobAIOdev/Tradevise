package scraper

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math"
	"math/rand"
	"net/http"
	"net/url"
	"os"
	"regexp"
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

var providerCooldownMu sync.Mutex
var providerCooldownUntil time.Time

const providerCooldownDuration = 60 * time.Second

var ErrProviderCoolingDown = errors.New("market data provider cooldown active")

const (
	langSchwarzSearchURL = "https://www.ls-tc.de/_rpc/json/.lstc/instrument/search/main"
	langSchwarzChartURL  = "https://www.ls-tc.de/_rpc/json/instrument/chart/dataForInstrument"
	langSchwarzMarketID  = "1"
	langSchwarzLocaleID  = "2"
	langSchwarzQuoteType = "mid"
	langSchwarzCurrency  = "EUR"
	langSchwarzExchange  = "Lang & Schwarz"
)

var isinPattern = regexp.MustCompile(`^[A-Z]{2}[A-Z0-9]{9}[0-9]$`)

var berlinLocation = loadBerlinLocation()

type langSchwarzInstrument struct {
	ID             int
	ISIN           string
	DisplayName    string
	CategorySymbol string
}

type langSchwarzSearchResult struct {
	ID             int    `json:"id"`
	DisplayName    string `json:"displayname"`
	ISIN           string `json:"isin"`
	CategorySymbol string `json:"categorySymbol"`
	InstrumentID   int    `json:"instrumentId"`
}

type langSchwarzChartResponse struct {
	Info struct {
		ISIN      string `json:"isin"`
		Plotlines []struct {
			ID    string  `json:"id"`
			Label string  `json:"label"`
			Value float64 `json:"value"`
		} `json:"plotlines"`
	} `json:"info"`
	Series struct {
		Intraday langSchwarzSeries `json:"intraday"`
		History  langSchwarzSeries `json:"history"`
	} `json:"series"`
}

type langSchwarzSeries struct {
	Name string       `json:"name"`
	Data [][2]float64 `json:"data"`
}

type MarketSnapshot struct {
	Instrument     langSchwarzInstrument
	IntradayPoints []model.PricePoint
	DailyPoints    []model.PricePoint
	Meta           model.StockMeta
	LiveEvent      model.LivePriceEvent
}

type providerCooldownError struct {
	until time.Time
}

var instrumentCache = struct {
	sync.RWMutex
	byISIN map[string]langSchwarzInstrument
}{
	byISIN: make(map[string]langSchwarzInstrument),
}

func (e providerCooldownError) Error() string {
	return fmt.Sprintf("%s until %s", ErrProviderCoolingDown, e.until.Format(time.RFC3339))
}

func (e providerCooldownError) Unwrap() error {
	return ErrProviderCoolingDown
}

func IsProviderCoolingDownError(err error) bool {
	return errors.Is(err, ErrProviderCoolingDown)
}

func IsProviderCoolingDown() bool {
	return providerCooldownErrorIfActive() != nil
}

func providerCooldownErrorIfActive() error {
	providerCooldownMu.Lock()
	defer providerCooldownMu.Unlock()

	now := time.Now()
	if now.Before(providerCooldownUntil) {
		return providerCooldownError{until: providerCooldownUntil}
	}

	return nil
}

func markProviderCooldown() {
	providerCooldownMu.Lock()
	defer providerCooldownMu.Unlock()

	until := time.Now().Add(providerCooldownDuration)
	if until.After(providerCooldownUntil) {
		providerCooldownUntil = until
	}
}

func shouldCooldownProvider(err error) bool {
	if err == nil {
		return false
	}
	if errors.Is(err, context.DeadlineExceeded) || os.IsTimeout(err) {
		return true
	}

	return strings.Contains(err.Error(), "rate limited")
}

func normalizeLangSchwarzSymbol(symbol string) (string, error) {
	normalized := strings.ToUpper(strings.TrimSpace(symbol))
	if normalized == "" {
		return "", fmt.Errorf("symbol is required")
	}
	if !isinPattern.MatchString(normalized) {
		return "", fmt.Errorf("only Lang & Schwarz EUR instruments identified by ISIN are supported")
	}

	return normalized, nil
}

func loadBerlinLocation() *time.Location {
	location, err := time.LoadLocation("Europe/Berlin")
	if err != nil {
		return time.FixedZone("Europe/Berlin", 2*60*60)
	}

	return location
}

func fetchJSON(ctx context.Context, requestURL string, target interface{}) error {
	req, err := http.NewRequestWithContext(ctx, "GET", requestURL, nil)
	if err != nil {
		return err
	}

	req.Header.Set("Accept", "application/json")
	req.Header.Set("User-Agent", userAgents[rand.Intn(len(userAgents))])
	req.Header.Set("Referer", "https://www.ls-tc.de/")

	resp, err := httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusTooManyRequests {
		return fmt.Errorf("rate limited (429)")
	}
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("unexpected status: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	if err := json.Unmarshal(body, target); err != nil {
		return err
	}

	return nil
}

func fetchWithCooldown(ctx context.Context, requestURL string, target interface{}) error {
	if err := providerCooldownErrorIfActive(); err != nil {
		return err
	}

	requestCtx, cancel := context.WithTimeout(ctx, 6*time.Second)
	err := fetchJSON(requestCtx, requestURL, target)
	cancel()

	if shouldCooldownProvider(err) {
		markProviderCooldown()
	}

	return err
}

func buildSearchURL(query string) string {
	u, _ := url.Parse(langSchwarzSearchURL)
	values := u.Query()
	values.Set("q", query)
	values.Set("localeId", langSchwarzLocaleID)
	u.RawQuery = values.Encode()

	return u.String()
}

func buildChartURL(instrumentID int) string {
	u, _ := url.Parse(langSchwarzChartURL)
	values := u.Query()
	values.Set("container", "chart1")
	values.Set("instrumentId", fmt.Sprintf("%d", instrumentID))
	values.Set("marketId", langSchwarzMarketID)
	values.Set("quotetype", langSchwarzQuoteType)
	values.Set("series", "intraday,history,flags")
	values.Set("type", "")
	values.Set("localeId", langSchwarzLocaleID)
	u.RawQuery = values.Encode()

	return u.String()
}

func isSupportedInstrumentCategory(category string) bool {
	switch strings.ToUpper(strings.TrimSpace(category)) {
	case "STK", "ETF":
		return true
	default:
		return false
	}
}

func resolveInstrument(ctx context.Context, symbol string) (langSchwarzInstrument, error) {
	symbol, err := normalizeLangSchwarzSymbol(symbol)
	if err != nil {
		return langSchwarzInstrument{}, err
	}

	instrumentCache.RLock()
	cached, ok := instrumentCache.byISIN[symbol]
	instrumentCache.RUnlock()
	if ok {
		return cached, nil
	}

	var results []langSchwarzSearchResult
	if err := fetchWithCooldown(ctx, buildSearchURL(symbol), &results); err != nil {
		return langSchwarzInstrument{}, err
	}

	for _, result := range results {
		if !strings.EqualFold(result.ISIN, symbol) {
			continue
		}
		if !isSupportedInstrumentCategory(result.CategorySymbol) {
			continue
		}

		instrumentID := result.InstrumentID
		if instrumentID == 0 {
			instrumentID = result.ID
		}
		if instrumentID <= 0 {
			continue
		}

		instrument := langSchwarzInstrument{
			ID:             instrumentID,
			ISIN:           symbol,
			DisplayName:    result.DisplayName,
			CategorySymbol: result.CategorySymbol,
		}

		instrumentCache.Lock()
		instrumentCache.byISIN[symbol] = instrument
		instrumentCache.Unlock()

		return instrument, nil
	}

	return langSchwarzInstrument{}, fmt.Errorf("no Lang & Schwarz instrument found for %s", symbol)
}

func fetchChart(ctx context.Context, symbol string) (langSchwarzInstrument, langSchwarzChartResponse, error) {
	instrument, err := resolveInstrument(ctx, symbol)
	if err != nil {
		return langSchwarzInstrument{}, langSchwarzChartResponse{}, err
	}

	var chart langSchwarzChartResponse
	if err := fetchWithCooldown(ctx, buildChartURL(instrument.ID), &chart); err != nil {
		return langSchwarzInstrument{}, langSchwarzChartResponse{}, err
	}

	if chart.Info.ISIN != "" && !strings.EqualFold(chart.Info.ISIN, instrument.ISIN) {
		return langSchwarzInstrument{}, langSchwarzChartResponse{}, fmt.Errorf("instrument %d returned ISIN %s, want %s", instrument.ID, chart.Info.ISIN, instrument.ISIN)
	}
	if len(chart.Series.Intraday.Data) == 0 && len(chart.Series.History.Data) == 0 {
		return langSchwarzInstrument{}, langSchwarzChartResponse{}, fmt.Errorf("no chart data for %s", symbol)
	}

	return instrument, chart, nil
}

func parseSeriesPoints(data [][2]float64) []model.PricePoint {
	points := make([]model.PricePoint, 0, len(data))
	for _, pair := range data {
		timestampMillis := int64(pair[0])
		price := pair[1]
		if timestampMillis <= 0 || price <= 0 {
			continue
		}

		points = append(points, model.PricePoint{
			Time:  timestampMillis / 1000,
			Price: price,
		})
	}

	return points
}

func parseIntradaySeriesPoints(data [][2]float64) []model.PricePoint {
	points := make([]model.PricePoint, 0, len(data))
	for _, pair := range data {
		timestampMillis := int64(pair[0])
		price := pair[1]
		if timestampMillis <= 0 || price <= 0 {
			continue
		}

		points = append(points, model.PricePoint{
			Time:  langSchwarzLocalMillisToUnix(timestampMillis),
			Price: price,
		})
	}

	return points
}

func langSchwarzLocalMillisToUnix(timestampMillis int64) int64 {
	localTimestamp := time.UnixMilli(timestampMillis).UTC()
	return time.Date(
		localTimestamp.Year(),
		localTimestamp.Month(),
		localTimestamp.Day(),
		localTimestamp.Hour(),
		localTimestamp.Minute(),
		localTimestamp.Second(),
		localTimestamp.Nanosecond(),
		berlinLocation,
	).Unix()
}

func latestPositivePoint(points []model.PricePoint) (model.PricePoint, bool) {
	for i := len(points) - 1; i >= 0; i-- {
		if points[i].Time > 0 && points[i].Price > 0 {
			return points[i], true
		}
	}

	return model.PricePoint{}, false
}

func previousCloseFromPlotlines(chart langSchwarzChartResponse) (float64, bool) {
	for _, plotline := range chart.Info.Plotlines {
		label := strings.ToLower(plotline.Label)
		if plotline.Value > 0 && (plotline.ID == "previousDay" || strings.Contains(label, "vortag")) {
			return plotline.Value, true
		}
	}

	return 0, false
}

func previousCloseFromHistory(currentTime int64, history []model.PricePoint) (float64, bool) {
	if currentTime > 0 {
		dayStart := startOfBerlinDay(currentTime)
		for i := len(history) - 1; i >= 0; i-- {
			if history[i].Time < dayStart && history[i].Price > 0 {
				return history[i].Price, true
			}
		}
	}

	if len(history) >= 2 {
		for i := len(history) - 2; i >= 0; i-- {
			if history[i].Price > 0 {
				return history[i].Price, true
			}
		}
	}

	return 0, false
}

func startOfBerlinDay(timestamp int64) int64 {
	t := time.Unix(timestamp, 0).In(berlinLocation)
	start := time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, berlinLocation)

	return start.Unix()
}

func dayRange(points []model.PricePoint) (float64, float64) {
	high := 0.0
	low := math.MaxFloat64

	for _, point := range points {
		if point.Price <= 0 {
			continue
		}
		if point.Price > high {
			high = point.Price
		}
		if point.Price < low {
			low = point.Price
		}
	}

	if low == math.MaxFloat64 {
		low = 0
	}

	return high, low
}

func fiftyTwoWeekRange(history []model.PricePoint) (float64, float64) {
	latest, ok := latestPositivePoint(history)
	if !ok {
		return 0, 0
	}

	cutoff := time.Unix(latest.Time, 0).AddDate(-1, 0, 0).Unix()
	high := 0.0
	low := math.MaxFloat64

	for _, point := range history {
		if point.Time < cutoff || point.Price <= 0 {
			continue
		}
		if point.Price > high {
			high = point.Price
		}
		if point.Price < low {
			low = point.Price
		}
	}

	if low == math.MaxFloat64 {
		low = 0
	}

	return high, low
}

func chartPoints(chart langSchwarzChartResponse) ([]model.PricePoint, []model.PricePoint) {
	return parseIntradaySeriesPoints(chart.Series.Intraday.Data), parseSeriesPoints(chart.Series.History.Data)
}

func FetchMarketSnapshot(symbol string) (MarketSnapshot, error) {
	instrument, chart, err := fetchChart(context.Background(), symbol)
	if err != nil {
		return MarketSnapshot{}, err
	}

	intradayPoints, historyPoints := chartPoints(chart)
	latest, ok := latestPositivePoint(intradayPoints)
	if !ok {
		latest, ok = latestPositivePoint(historyPoints)
	}
	if !ok {
		return MarketSnapshot{}, fmt.Errorf("no positive live price for %s", symbol)
	}

	previousClose, ok := previousCloseFromPlotlines(chart)
	if !ok {
		previousClose, _ = previousCloseFromHistory(latest.Time, historyPoints)
	}

	change := latest.Price - previousClose
	changePercent := 0.0
	if previousClose != 0 {
		changePercent = (change / previousClose) * 100
	}

	dayHigh, dayLow := dayRange(intradayPoints)
	fiftyTwoWeekHigh, fiftyTwoWeekLow := fiftyTwoWeekRange(historyPoints)

	name := chart.Series.History.Name
	if name == "" {
		name = instrument.DisplayName
	}

	meta := model.StockMeta{
		Symbol:           instrument.ISIN,
		Name:             name,
		Currency:         langSchwarzCurrency,
		Exchange:         langSchwarzExchange,
		PreviousClose:    previousClose,
		DayHigh:          dayHigh,
		DayLow:           dayLow,
		FiftyTwoWeekHigh: fiftyTwoWeekHigh,
		FiftyTwoWeekLow:  fiftyTwoWeekLow,
		Volume:           0,
	}

	snapshot := MarketSnapshot{
		Instrument:     instrument,
		IntradayPoints: intradayPoints,
		DailyPoints:    historyPoints,
		Meta:           meta,
		LiveEvent: model.LivePriceEvent{
			Symbol:           instrument.ISIN,
			Price:            latest.Price,
			Time:             latest.Time,
			PreviousClose:    previousClose,
			Change:           change,
			ChangePercent:    changePercent,
			DayHigh:          dayHigh,
			DayLow:           dayLow,
			FiftyTwoWeekHigh: fiftyTwoWeekHigh,
			FiftyTwoWeekLow:  fiftyTwoWeekLow,
		},
	}

	if point, ok := latestIntradayPoint(intradayPoints); ok {
		pointCopy := point
		snapshot.LiveEvent.IntradayPoint = &pointCopy
	}

	return snapshot, nil
}

func latestIntradayPoint(points []model.PricePoint) (model.PricePoint, bool) {
	return latestPositivePoint(points)
}

func FetchLivePrice(symbol string) (price float64, previousClose float64, change float64, changePercent float64, ts int64, err error) {
	snapshot, err := FetchMarketSnapshot(symbol)
	if err != nil {
		return 0, 0, 0, 0, 0, err
	}

	return snapshot.LiveEvent.Price,
		snapshot.LiveEvent.PreviousClose,
		snapshot.LiveEvent.Change,
		snapshot.LiveEvent.ChangePercent,
		snapshot.LiveEvent.Time,
		nil
}

func FetchIntraday(symbol string) ([]model.PricePoint, string, error) {
	_, chart, err := fetchChart(context.Background(), symbol)
	if err != nil {
		return nil, "", err
	}

	points := parseIntradaySeriesPoints(chart.Series.Intraday.Data)

	return points, langSchwarzCurrency, nil
}

func FetchBootstrapIntraday(symbol string) ([]model.PricePoint, string, error) {
	return FetchIntraday(symbol)
}

func FetchDaily(symbol string) ([]model.PricePoint, string, error) {
	_, chart, err := fetchChart(context.Background(), symbol)
	if err != nil {
		return nil, "", err
	}

	points := parseSeriesPoints(chart.Series.History.Data)

	return points, langSchwarzCurrency, nil
}

func FetchMeta(symbol string) (model.StockMeta, error) {
	snapshot, err := FetchMarketSnapshot(symbol)
	if err != nil {
		return model.StockMeta{}, err
	}

	return snapshot.Meta, nil
}
