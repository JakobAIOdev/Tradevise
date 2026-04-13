package config

import "testing"

func TestGetEnvReturnsConfiguredValue(t *testing.T) {
	t.Setenv("TRADEVISE_TEST_VALUE", "configured")

	got := getEnv("TRADEVISE_TEST_VALUE", "fallback")
	if got != "configured" {
		t.Fatalf("getEnv() = %q, want %q", got, "configured")
	}
}

func TestGetEnvReturnsFallbackForMissingOrEmptyValue(t *testing.T) {
	t.Setenv("TRADEVISE_TEST_EMPTY", "")

	tests := []struct {
		name string
		key  string
	}{
		{name: "missing", key: "TRADEVISE_TEST_MISSING"},
		{name: "empty", key: "TRADEVISE_TEST_EMPTY"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := getEnv(tt.key, "fallback")
			if got != "fallback" {
				t.Fatalf("getEnv() = %q, want %q", got, "fallback")
			}
		})
	}
}

func TestLoadUsesEnvironmentValues(t *testing.T) {
	t.Setenv("REDIS_URL", "redis://redis.example:6379")
	t.Setenv("DATABASE_URL", "postgres://db.example/tradevise")

	cfg := Load()
	if cfg.RedisURL != "redis://redis.example:6379" {
		t.Fatalf("RedisURL = %q, want %q", cfg.RedisURL, "redis://redis.example:6379")
	}
	if cfg.DatabaseURL != "postgres://db.example/tradevise" {
		t.Fatalf("DatabaseURL = %q, want %q", cfg.DatabaseURL, "postgres://db.example/tradevise")
	}
}
