CREATE TABLE IF NOT EXISTS prices_intraday (
    symbol  TEXT        NOT NULL,
    time    TIMESTAMPTZ NOT NULL,
    price   NUMERIC(14,4) NOT NULL,
    PRIMARY KEY (symbol, time)
);

CREATE TABLE IF NOT EXISTS prices_weekly (
    symbol  TEXT NOT NULL,
    date    DATE NOT NULL,
    price   NUMERIC(14,4) NOT NULL,
    PRIMARY KEY (symbol, date)
);

CREATE TABLE IF NOT EXISTS tracked_symbols (
    symbol           TEXT PRIMARY KEY,
    name             TEXT,
    currency         TEXT,
    bootstrap_status TEXT DEFAULT 'PENDING',
    bootstrapped_at  TIMESTAMPTZ,
    last_intraday_fetch TIMESTAMPTZ,
    last_weekly_fetch   TIMESTAMPTZ
);