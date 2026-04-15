CREATE TABLE IF NOT EXISTS "stock_meta" (
    "symbol" TEXT NOT NULL,
    "name" TEXT,
    "currency" TEXT,
    "exchange" TEXT,
    "previous_close" NUMERIC(14,4),
    "day_high" NUMERIC(14,4),
    "day_low" NUMERIC(14,4),
    "fifty_two_week_high" NUMERIC(14,4),
    "fifty_two_week_low" NUMERIC(14,4),
    "volume" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_meta_pkey" PRIMARY KEY ("symbol")
);
