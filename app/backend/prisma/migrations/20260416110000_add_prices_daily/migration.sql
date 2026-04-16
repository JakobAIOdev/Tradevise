CREATE TABLE IF NOT EXISTS "prices_daily" (
    "symbol" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "price" DECIMAL(14,4) NOT NULL,
    CONSTRAINT "prices_daily_pkey" PRIMARY KEY ("symbol", "date")
);

INSERT INTO "prices_daily" ("symbol", "date", "price")
SELECT "symbol", "date", "price"
FROM "prices_weekly"
ON CONFLICT ("symbol", "date") DO NOTHING;
