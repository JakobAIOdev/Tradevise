CREATE TEMP TABLE prices_intraday_normalized AS
SELECT DISTINCT ON (symbol, normalized_time)
  symbol,
  normalized_time AS time,
  price
FROM (
  SELECT
    symbol,
    ((time AT TIME ZONE 'UTC') AT TIME ZONE 'Europe/Berlin') AS normalized_time,
    price,
    time AS original_time
  FROM prices_intraday
) normalized
ORDER BY symbol, normalized_time, original_time DESC;

TRUNCATE TABLE prices_intraday;

INSERT INTO prices_intraday (symbol, time, price)
SELECT symbol, time, price
FROM prices_intraday_normalized;

DROP TABLE prices_intraday_normalized;
