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

	s.AddTracked("US0378331005", "EUR")
	s.AddTracked("DE0007164600", "EUR")

	got := s.GetTracked()
	if got["US0378331005"] != "EUR" {
		t.Fatalf("US0378331005 currency = %q, want %q", got["US0378331005"], "EUR")
	}
	if got["DE0007164600"] != "EUR" {
		t.Fatalf("DE0007164600 currency = %q, want %q", got["DE0007164600"], "EUR")
	}
	if !s.IsTracked("US0378331005") {
		t.Fatal("IsTracked(US0378331005) = false, want true")
	}
	if s.IsTracked("US5949181045") {
		t.Fatal("IsTracked(US5949181045) = true, want false")
	}
}

func TestGetTrackedReturnsCopy(t *testing.T) {
	s := newTestSymbolStore()
	s.AddTracked("US0378331005", "EUR")

	got := s.GetTracked()
	got["US0378331005"] = "USD"
	got["US5949181045"] = "EUR"

	again := s.GetTracked()
	if again["US0378331005"] != "EUR" {
		t.Fatalf("tracked US0378331005 currency mutated to %q, want %q", again["US0378331005"], "EUR")
	}
	if _, ok := again["US5949181045"]; ok {
		t.Fatal("external mutation added US5949181045 to tracked symbols")
	}
}

func TestSetAndGetActive(t *testing.T) {
	s := newTestSymbolStore()

	s.SetActive([]string{"US0378331005", "US5949181045"})
	got := s.GetActive()

	if len(got) != 2 {
		t.Fatalf("len(GetActive()) = %d, want %d", len(got), 2)
	}

	active := make(map[string]bool, len(got))
	for _, symbol := range got {
		active[symbol] = true
	}
	if !active["US0378331005"] || !active["US5949181045"] {
		t.Fatalf("GetActive() = %v, want US0378331005 and US5949181045", got)
	}
}

func TestSetActiveReplacesPreviousSymbols(t *testing.T) {
	s := newTestSymbolStore()

	s.SetActive([]string{"US0378331005", "US5949181045"})
	s.SetActive([]string{"DE0007164600"})

	got := s.GetActive()
	if len(got) != 1 || got[0] != "DE0007164600" {
		t.Fatalf("GetActive() = %v, want [DE0007164600]", got)
	}
}
