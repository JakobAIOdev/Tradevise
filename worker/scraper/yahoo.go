package scraper

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"time"
)

var userAgents = []string{
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/118.0.0.0 Safari/537.36",
}

var httpClient = &http.Client{Timeout: 10 * time.Second}

type yahooResponse struct {
	Chart struct {
		Result []struct {
			Meta struct {
				Currency             string  `json:"currency"`
				Symbol               string  `json:"symbol"`
				ExchangeName         string  `json:"exchangeName"`
				FullExchangeName     string  `json:"fullExchangeName"`
				InstrumentType       string  `json:"instrumentType"`
				FirstTradeDate       int     `json:"firstTradeDate"`
				RegularMarketTime    int     `json:"regularMarketTime"`
				HasPrePostMarketData bool    `json:"hasPrePostMarketData"`
				Gmtoffset            int     `json:"gmtoffset"`
				Timezone             string  `json:"timezone"`
				ExchangeTimezoneName string  `json:"exchangeTimezoneName"`
				RegularMarketPrice   float64 `json:"regularMarketPrice"`
				FiftyTwoWeekHigh     float64 `json:"fiftyTwoWeekHigh"`
				FiftyTwoWeekLow      float64 `json:"fiftyTwoWeekLow"`
				RegularMarketDayHigh float64 `json:"regularMarketDayHigh"`
				RegularMarketDayLow  float64 `json:"regularMarketDayLow"`
				RegularMarketVolume  int     `json:"regularMarketVolume"`
				LongName             string  `json:"longName"`
				ShortName            string  `json:"shortName"`
				ChartPreviousClose   float64 `json:"chartPreviousClose"`
				PreviousClose        float64 `json:"previousClose"`
				Scale                int     `json:"scale"`
				PriceHint            int     `json:"priceHint"`
				CurrentTradingPeriod struct {
					Pre struct {
						Timezone  string `json:"timezone"`
						Start     int    `json:"start"`
						End       int    `json:"end"`
						Gmtoffset int    `json:"gmtoffset"`
					} `json:"pre"`
					Regular struct {
						Timezone  string `json:"timezone"`
						Start     int    `json:"start"`
						End       int    `json:"end"`
						Gmtoffset int    `json:"gmtoffset"`
					} `json:"regular"`
					Post struct {
						Timezone  string `json:"timezone"`
						Start     int    `json:"start"`
						End       int    `json:"end"`
						Gmtoffset int    `json:"gmtoffset"`
					} `json:"post"`
				} `json:"currentTradingPeriod"`
				TradingPeriods [][]struct {
					Timezone  string `json:"timezone"`
					Start     int    `json:"start"`
					End       int    `json:"end"`
					Gmtoffset int    `json:"gmtoffset"`
				} `json:"tradingPeriods"`
				DataGranularity string   `json:"dataGranularity"`
				Range           string   `json:"range"`
				ValidRanges     []string `json:"validRanges"`
			} `json:"meta"`
			Timestamp  []int `json:"timestamp"`
			Indicators struct {
				Quote []struct {
					Volume []int     `json:"volume"`
					Close  []float64 `json:"close"`
					Open   []float64 `json:"open"`
					Low    []float64 `json:"low"`
					High   []float64 `json:"high"`
				} `json:"quote"`
			} `json:"indicators"`
		} `json:"result"`
		Error interface{} `json:"error"`
	} `json:"chart"`
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
		return nil ,err
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

func FetchLivePrice(symbol string) (float64, int64, error) {
    url := fmt.Sprintf(
        "https://query1.finance.yahoo.com/v8/finance/chart/%s?interval=1m&range=1d",
        symbol,
    )

    r, err := fetch(context.Background(), url)
    if err != nil {
        return 0, 0, err
    }

    price := r.Chart.Result[0].Meta.RegularMarketPrice
    ts := time.Now().Unix()

    return price, ts, nil
}