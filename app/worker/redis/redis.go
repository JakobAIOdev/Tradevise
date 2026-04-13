package redis

import (
	"log"

	goredis "github.com/redis/go-redis/v9"
	"gitlab.ct.fh-salzburg.ac.at/fhs52920/tradevise/app/worker/config"
)

func New(cfg *config.Config) *goredis.Client {
    opt, err := goredis.ParseURL(cfg.RedisURL)

    if err != nil {
        log.Fatalf("Error connecting to Redis: %s", err)
    }

    return goredis.NewClient(opt)
}