package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
    RedisURL    string
    DatabaseURL string
}

func Load() *Config {
    if err := godotenv.Load(); err != nil {
        log.Println("config: no .env file found")
    }

    return &Config{
        RedisURL:    getEnv("REDIS_URL", "redis://localhost:6379"),
        DatabaseURL: getEnv("DATABASE_URL", "postgres://tradevise:secret@localhost:5432/tradevise?sslmode=disable"),
    }
}

func getEnv(key, fallback string) string {
    if v := os.Getenv(key); v != "" {
        return v
    }
    return fallback
}