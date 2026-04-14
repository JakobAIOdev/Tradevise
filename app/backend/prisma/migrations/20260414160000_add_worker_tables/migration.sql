-- CreateTable
CREATE TABLE IF NOT EXISTS "prices_intraday" (
    "symbol" TEXT NOT NULL,
    "time" TIMESTAMPTZ NOT NULL,
    "price" NUMERIC(14,4) NOT NULL,

    CONSTRAINT "prices_intraday_pkey" PRIMARY KEY ("symbol", "time")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "prices_weekly" (
    "symbol" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "price" NUMERIC(14,4) NOT NULL,

    CONSTRAINT "prices_weekly_pkey" PRIMARY KEY ("symbol", "date")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "tracked_symbols" (
    "symbol" TEXT NOT NULL,
    "name" TEXT,
    "currency" TEXT,
    "bootstrap_status" TEXT DEFAULT 'PENDING',
    "bootstrapped_at" TIMESTAMPTZ,
    "last_intraday_fetch" TIMESTAMPTZ,
    "last_weekly_fetch" TIMESTAMPTZ,

    CONSTRAINT "tracked_symbols_pkey" PRIMARY KEY ("symbol")
);
