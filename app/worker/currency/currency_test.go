package converter

import "testing"

func TestToEURKeepsEURPrice(t *testing.T) {
	c := &CurrencyConverter{usdToEur: 0.91}

	got := c.ToEUR(123.45, "EUR")
	if got != 123.45 {
		t.Fatalf("ToEUR() = %v, want %v", got, 123.45)
	}
}

func TestToEURConvertsNonEURPrice(t *testing.T) {
	c := &CurrencyConverter{usdToEur: 0.9}

	got := c.ToEUR(100, "USD")
	if got != 90 {
		t.Fatalf("ToEUR() = %v, want %v", got, 90.0)
	}
}

func TestToEURFallsBackWhenRateIsMissing(t *testing.T) {
	c := &CurrencyConverter{}

	got := c.ToEUR(100, "USD")
	if got != 100 {
		t.Fatalf("ToEUR() = %v, want %v", got, 100.0)
	}
}
