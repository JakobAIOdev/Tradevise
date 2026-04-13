package store

import "testing"

func newTestSymbolStore() *SymbolStore {
	return &SymbolStore{
		tracked: make(map[string]string),
		active:  make(map[string]bool),
	}
}

func TestAddAndGetTracked(t *testing.T) {
	s := newTestSymbolStore()

	s.AddTracked("AAPL", "USD")
	s.AddTracked("SAP.DE", "EUR")

	got := s.GetTracked()
	if got["AAPL"] != "USD" {
		t.Fatalf("AAPL currency = %q, want %q", got["AAPL"], "USD")
	}
	if got["SAP.DE"] != "EUR" {
		t.Fatalf("SAP.DE currency = %q, want %q", got["SAP.DE"], "EUR")
	}
	if !s.IsTracked("AAPL") {
		t.Fatal("IsTracked(AAPL) = false, want true")
	}
	if s.IsTracked("MSFT") {
		t.Fatal("IsTracked(MSFT) = true, want false")
	}
}

func TestGetTrackedReturnsCopy(t *testing.T) {
	s := newTestSymbolStore()
	s.AddTracked("AAPL", "USD")

	got := s.GetTracked()
	got["AAPL"] = "EUR"
	got["MSFT"] = "USD"

	again := s.GetTracked()
	if again["AAPL"] != "USD" {
		t.Fatalf("tracked AAPL currency mutated to %q, want %q", again["AAPL"], "USD")
	}
	if _, ok := again["MSFT"]; ok {
		t.Fatal("external mutation added MSFT to tracked symbols")
	}
}

func TestSetAndGetActive(t *testing.T) {
	s := newTestSymbolStore()

	s.SetActive([]string{"AAPL", "MSFT"})
	got := s.GetActive()

	if len(got) != 2 {
		t.Fatalf("len(GetActive()) = %d, want %d", len(got), 2)
	}

	active := make(map[string]bool, len(got))
	for _, symbol := range got {
		active[symbol] = true
	}
	if !active["AAPL"] || !active["MSFT"] {
		t.Fatalf("GetActive() = %v, want AAPL and MSFT", got)
	}
}

func TestSetActiveReplacesPreviousSymbols(t *testing.T) {
	s := newTestSymbolStore()

	s.SetActive([]string{"AAPL", "MSFT"})
	s.SetActive([]string{"SAP.DE"})

	got := s.GetActive()
	if len(got) != 1 || got[0] != "SAP.DE" {
		t.Fatalf("GetActive() = %v, want [SAP.DE]", got)
	}
}
