import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  MessageEvent,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Observable, type Subscriber } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';

type YahooSearchResponse = {
  quotes?: YahooQuote[];
};

type YahooQuote = {
  quoteType?: string;
  symbol?: string;
  shortname?: string;
  longname?: string;
  logoUrl?: string;
  exchange?: string;
};

export type StockSuggestion = {
  symbol: string;
  name: string;
  type: 'STOCK' | 'ETF' | 'CRYPTO';
  logoUrl: string | null;
};

type LivePriceEvent = {
  symbol: string;
  price?: number;
  time: number;
  previousClose?: number;
  change?: number;
  changePercent?: number;
  bootstrapDone?: boolean;
};

type DiscoverStockDefinition = {
  name: string;
  ticker: string;
  logo: string;
};

type DiscoverStock = DiscoverStockDefinition & {
  change: number;
  price?: number;
  changeValue?: number;
};

type ChartRange = '1D' | '1W' | '1M' | '1Y' | 'ALL';

type GraphPoint = {
  time: number;
  price: number;
};

type ChartHistoryResponse = {
  symbol: string;
  range: ChartRange;
  status: 'READY' | 'BOOTSTRAPPING';
  source: 'intraday' | 'weekly';
  points: GraphPoint[];
};

type ChartRow = {
  time: bigint | number | string;
  price: number;
};

type TrackedSymbolRow = {
  bootstrap_status: string | null;
};

type LiveSubscription = {
  symbol: string;
  channel: string;
  onMessage: (message: string) => void;
};

const XETRA_SYMBOL_SUFFIX = '.DE';
const GERMAN_EXCHANGE_SUFFIXES = new Set([
  '.BE',
  '.BM',
  '.DU',
  '.F',
  '.HA',
  '.HM',
  '.MU',
  '.SG',
]);
const GERMAN_YAHOO_EXCHANGES = new Set([
  'BER',
  'DUS',
  'FRA',
  'HAM',
  'HAN',
  'MUN',
  'STU',
]);

const DISCOVER_STOCKS: DiscoverStockDefinition[] = [
  {
    name: 'Apple Inc.',
    ticker: 'APC.DE',
    logo: 'https://s.yimg.com/lb/brands/150x150_apple.png',
  },
  {
    name: 'Tesla',
    ticker: 'TL0.DE',
    logo: 'https://s.yimg.com/lb/brands/150x150_tesla.png',
  },
  {
    name: 'Microsoft',
    ticker: 'MSF.DE',
    logo: 'https://s.yimg.com/lb/brands/150x150_microsoft.png',
  },
  {
    name: 'Amazon',
    ticker: 'AMZ.DE',
    logo: 'https://s.yimg.com/lb/brands/150x150_amazon.png',
  },
  {
    name: 'NVIDIA',
    ticker: 'NVD.DE',
    logo: 'https://s.yimg.com/lb/brands/150x150_nvidia.png',
  },
  {
    name: 'Alphabet',
    ticker: 'ABEA.DE',
    logo: 'https://s.yimg.com/lb/brands/150x150_google.png',
  },
];

const CHART_RANGES = ['1D', '1W', '1M', '1Y', 'ALL'] as const;

function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

function getSymbolSuffix(symbol: string): string | null {
  const suffixStart = symbol.lastIndexOf('.');
  if (suffixStart === -1 || suffixStart === symbol.length - 1) return null;

  return symbol.slice(suffixStart);
}

function replaceSymbolSuffix(symbol: string, suffix: string): string {
  const suffixStart = symbol.lastIndexOf('.');
  if (suffixStart === -1) return `${symbol}${suffix}`;

  return `${symbol.slice(0, suffixStart)}${suffix}`;
}

function hasValidYahooSymbolChars(symbol: string): boolean {
  return (
    symbol.length > XETRA_SYMBOL_SUFFIX.length && /^[A-Z0-9.\-]+$/.test(symbol)
  );
}

function isXetraSymbol(symbol: string): boolean {
  const normalizedSymbol = normalizeSymbol(symbol);
  return (
    hasValidYahooSymbolChars(normalizedSymbol) &&
    getSymbolSuffix(normalizedSymbol) === XETRA_SYMBOL_SUFFIX
  );
}

function toXetraSymbol(quote: YahooQuote): string | null {
  if (typeof quote.symbol !== 'string' || quote.quoteType !== 'EQUITY') {
    return null;
  }

  const symbol = normalizeSymbol(quote.symbol);
  if (isXetraSymbol(symbol)) {
    return symbol;
  }

  const exchange = quote.exchange?.trim().toUpperCase();
  const suffix = getSymbolSuffix(symbol);
  if (
    suffix &&
    GERMAN_EXCHANGE_SUFFIXES.has(suffix) &&
    (!exchange || GERMAN_YAHOO_EXCHANGES.has(exchange))
  ) {
    return replaceSymbolSuffix(symbol, XETRA_SYMBOL_SUFFIX);
  }

  return null;
}

function buildFallbackLogoUrl(symbol: string): string {
  return `https://api.elbstream.com/logos/symbol/${encodeURIComponent(symbol)}`;
}

@Injectable()
export class StocksService {
  constructor(
    private readonly redisService: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  async search(query: string): Promise<StockSuggestion[]> {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return [];

    const url = new URL('https://query1.finance.yahoo.com/v1/finance/search');
    url.search = new URLSearchParams({
      q: trimmedQuery,
      quotesCount: '25',
      newsCount: '0',
      enableLogoUrl: 'true',
      lang: 'de-DE',
      region: 'DE',
    }).toString();

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'tradevise/1.0',
      },
    });

    if (!response.ok) {
      throw new BadGatewayException('Stock search provider failed');
    }

    const data = (await response.json()) as YahooSearchResponse;
    const quotes = data.quotes ?? [];

    const suggestions = new Map<string, StockSuggestion>();

    for (const quote of quotes) {
      const xetraSymbol = toXetraSymbol(quote);
      if (!xetraSymbol || suggestions.has(xetraSymbol)) continue;

      suggestions.set(xetraSymbol, {
        symbol: xetraSymbol,
        name: quote.shortname || quote.longname || '',
        type: 'STOCK',
        logoUrl: quote.logoUrl ?? buildFallbackLogoUrl(xetraSymbol),
      });

      if (suggestions.size >= 8) break;
    }

    return [...suggestions.values()];
  }

  async getDiscoverStocks(): Promise<DiscoverStock[]> {
    return Promise.all(
      DISCOVER_STOCKS.map(async (stock): Promise<DiscoverStock> => {
        const latest = await this.redisService.getJson<LivePriceEvent>(
          `stocklatest:${stock.ticker}`,
        );
        return this.mapDiscoverStock(stock, latest);
      }),
    );
  }

  streamLivePrice(symbol: string): Observable<MessageEvent> {
    const normalizedSymbol = this.parseXetraSymbol(symbol);

    return new Observable<MessageEvent>((subscriber) => {
      const channel = `stocklive:${normalizedSymbol}`;
      const onMessage = this.createLiveMessageHandler(
        normalizedSymbol,
        subscriber,
      );

      void (async () => {
        await this.subscribeToLiveSymbol(normalizedSymbol, channel, onMessage);
      })().catch((error: unknown) => {
        subscriber.error(error);
      });

      return () => {
        void this.unsubscribeFromLiveSymbol(
          normalizedSymbol,
          channel,
          onMessage,
        );
      };
    });
  }

  streamLivePrices(symbols: string[]): Observable<MessageEvent> {
    const normalizedSymbols = this.parseUniqueXetraSymbols(symbols);

    if (normalizedSymbols.length === 0) {
      throw new BadRequestException('At least one valid symbol is required');
    }

    return new Observable<MessageEvent>((subscriber) => {
      const subscriptions: LiveSubscription[] = normalizedSymbols.map(
        (symbol) => {
          const channel = `stocklive:${symbol}`;
          const onMessage = this.createLiveMessageHandler(symbol, subscriber);
          return { symbol, channel, onMessage };
        },
      );

      void (async () => {
        await Promise.all(
          subscriptions.map(({ symbol, channel, onMessage }) =>
            this.subscribeToLiveSymbol(symbol, channel, onMessage),
          ),
        );
      })().catch((error: unknown) => {
        subscriber.error(error);
      });

      return () => {
        void Promise.all(
          subscriptions.map(({ symbol, channel, onMessage }) =>
            this.unsubscribeFromLiveSymbol(symbol, channel, onMessage),
          ),
        );
      };
    });
  }

  async getChartHistory(
    symbol: string,
    rangeInput: string,
  ): Promise<ChartHistoryResponse> {
    const normalizedSymbol = this.parseXetraSymbol(symbol);

    const range = this.parseChartRange(rangeInput);
    const status = await this.ensureBootstrapStartedIfNeeded(normalizedSymbol);

    if (range === '1D' || range === '1W' || range === '1M') {
      const intervalSql = this.getIntradayIntervalSql(range);
      const rows = await this.prisma.$queryRaw<ChartRow[]>(Prisma.sql`
        SELECT
          EXTRACT(EPOCH FROM time)::bigint AS time,
          price::double precision AS price
        FROM prices_intraday
        WHERE symbol = ${normalizedSymbol}
          AND time >= NOW() - ${intervalSql}
        ORDER BY time ASC
      `);

      return {
        symbol: normalizedSymbol,
        range,
        status,
        source: 'intraday',
        points: rows.map((row) => this.mapChartRow(row)),
      };
    }

    const whereClause =
      range === '1Y'
        ? Prisma.sql`WHERE symbol = ${normalizedSymbol} AND date >= CURRENT_DATE - INTERVAL '1 year'`
        : Prisma.sql`WHERE symbol = ${normalizedSymbol}`;

    const rows = await this.prisma.$queryRaw<ChartRow[]>(Prisma.sql`
      SELECT
        EXTRACT(EPOCH FROM (date::timestamp AT TIME ZONE 'UTC'))::bigint AS time,
        price::double precision AS price
      FROM prices_weekly
      ${whereClause}
      ORDER BY date ASC
    `);

    return {
      symbol: normalizedSymbol,
      range,
      status,
      source: 'weekly',
      points: rows.map((row) => this.mapChartRow(row)),
    };
  }

  private async ensureBootstrapStartedIfNeeded(
    symbol: string,
  ): Promise<'READY' | 'BOOTSTRAPPING'> {
    const trackedRows = await this.prisma.$queryRaw<
      TrackedSymbolRow[]
    >(Prisma.sql`
      SELECT bootstrap_status
      FROM tracked_symbols
      WHERE symbol = ${symbol}
      LIMIT 1
    `);

    const tracked = trackedRows[0];
    if (tracked?.bootstrap_status === 'DONE') {
      return 'READY';
    }

    await this.redisService.enqueueBootstrapOnce(symbol);

    return 'BOOTSTRAPPING';
  }

  private parseXetraSymbol(symbol: string): string {
    const normalizedSymbol = normalizeSymbol(symbol);
    if (!normalizedSymbol) {
      throw new BadRequestException('Symbol is required');
    }
    if (!isXetraSymbol(normalizedSymbol)) {
      throw new BadRequestException(
        `Only Xetra stock symbols ending in ${XETRA_SYMBOL_SUFFIX} are supported`,
      );
    }

    return normalizedSymbol;
  }

  private parseUniqueXetraSymbols(symbols: string[]): string[] {
    return [
      ...new Set(
        symbols
          .map((symbol) => symbol.trim())
          .filter((symbol) => symbol.length > 0)
          .map((symbol) => this.parseXetraSymbol(symbol)),
      ),
    ];
  }

  private mapDiscoverStock(
    stock: DiscoverStockDefinition,
    latest: LivePriceEvent | null,
  ): DiscoverStock {
    return {
      ...stock,
      price: latest?.price,
      change: latest?.changePercent ?? 0,
      changeValue: latest?.change,
    };
  }

  private createLiveMessageHandler(
    symbol: string,
    subscriber: Subscriber<MessageEvent>,
  ) {
    return (message: string) => {
      try {
        subscriber.next({
          data: JSON.parse(message) as LivePriceEvent,
        });
      } catch {
        subscriber.next({
          data: {
            symbol,
            raw: message,
          },
        });
      }
    };
  }

  private async subscribeToLiveSymbol(
    symbol: string,
    channel: string,
    onMessage: (message: string) => void,
  ) {
    await this.redisService.subscribe(channel, onMessage);
    await this.redisService.incrementActiveSubscriber(symbol);
    await this.redisService.markSymbolActive(symbol);
    await this.redisService.requestImmediateLivePrice(symbol);
  }

  private async unsubscribeFromLiveSymbol(
    symbol: string,
    channel: string,
    onMessage: (message: string) => void,
  ) {
    await this.redisService.unsubscribe(channel, onMessage);
    await this.redisService.decrementActiveSubscriber(symbol);
  }

  private parseChartRange(rangeInput: string): ChartRange {
    const normalizedRange = rangeInput.trim().toUpperCase() || '1D';

    if (CHART_RANGES.includes(normalizedRange as ChartRange)) {
      return normalizedRange as ChartRange;
    }

    throw new BadRequestException(
      'Invalid range. Allowed values: 1D, 1W, 1M, 1Y, ALL',
    );
  }

  private getIntradayIntervalSql(range: '1D' | '1W' | '1M') {
    switch (range) {
      case '1D':
        return Prisma.sql`INTERVAL '1 day'`;
      case '1W':
        return Prisma.sql`INTERVAL '7 days'`;
      case '1M':
        return Prisma.sql`INTERVAL '30 days'`;
    }
  }

  private mapChartRow(row: ChartRow): GraphPoint {
    return {
      time: Number(row.time),
      price: Number(row.price),
    };
  }
}
