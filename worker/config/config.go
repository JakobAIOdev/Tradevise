package config

import "os"

type Config struct {
    RedisURL    string
    DatabaseURL string
}

func Load() *Config {
    return &Config{
        RedisURL:    getEnv("REDIS_URL", "redis://localhost:6379"),
        DatabaseURL: getEnv("DATABASE_URL", "postgres://tradevise:secret@localhost:5432/tradevise"),
    }
}

func getEnv(key, fallback string) string {
    if v := os.Getenv(key); v != "" {
        return v
    }
    return fallback
}