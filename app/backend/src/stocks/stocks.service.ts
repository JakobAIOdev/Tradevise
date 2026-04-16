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

type LangSchwarzSearchResult = {
  id?: number;
  instrumentId?: number;
  displayname?: string;
  isin?: string;
  categorySymbol?: string;
  categoryName?: string;
};

export type StockSuggestion = {
  symbol: string;
  name: string;
  type: 'STOCK' | 'ETF' | 'CRYPTO';
  logoUrl: string | null;
};

type StockSuggestionCandidate = {
  rank: number;
  suggestion: StockSuggestion;
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

type StockStatisticsResponse = {
  symbol: string;
  status: 'READY' | 'BOOTSTRAPPING';
  name: string | null;
  currency: string | null;
  exchange: string | null;
  previousClose: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  volume: number | null;
  updatedAt: Date | null;
};

type CachedStockMeta = {
  symbol?: string;
  name?: string;
  currency?: string;
  exchange?: string;
  previousClose?: number;
  dayHigh?: number;
  dayLow?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  volume?: number;
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

const LANG_SCHWARZ_SEARCH_URL =
  'https://www.ls-x.de/_rpc/json/.lstc/instrument/search/main';
const ISIN_PATTERN = /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/;

const DISCOVER_STOCKS: DiscoverStockDefinition[] = [
  {
    name: 'Apple Inc.',
    ticker: 'US0378331005',
    logo: buildFallbackLogoUrl('US0378331005'),
  },
  {
    name: 'Tesla',
    ticker: 'US88160R1014',
    logo: buildFallbackLogoUrl('US88160R1014'),
  },
  {
    name: 'Microsoft',
    ticker: 'US5949181045',
    logo: buildFallbackLogoUrl('US5949181045'),
  },
  {
    name: 'Amazon',
    ticker: 'US0231351067',
    logo: buildFallbackLogoUrl('US0231351067'),
  },
  {
    name: 'NVIDIA',
    ticker: 'US67066G1040',
    logo: buildFallbackLogoUrl('US67066G1040'),
  },
  {
    name: 'Alphabet',
    ticker: 'US02079K3059',
    logo: buildFallbackLogoUrl('US02079K3059'),
  },
];

const CHART_RANGES = ['1D', '1W', '1M', '1Y', 'ALL'] as const;

function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

function isSupportedLangSchwarzSymbol(symbol: string): boolean {
  const normalizedSymbol = normalizeSymbol(symbol);

  return ISIN_PATTERN.test(normalizedSymbol);
}

function getInstrumentType(
  result: LangSchwarzSearchResult,
): StockSuggestion['type'] | null {
  switch (result.categorySymbol?.toUpperCase()) {
    case 'STK':
      return 'STOCK';
    case 'ETF':
      return 'ETF';
    default:
      return null;
  }
}

function buildFallbackLogoUrl(isin: string): string {
  return `https://api.elbstream.com/logos/isin/${encodeURIComponent(isin)}`;
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

    const url = new URL(LANG_SCHWARZ_SEARCH_URL);
    url.search = new URLSearchParams({
      q: trimmedQuery,
      localeId: '2',
    }).toString();

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        Referer: 'https://www.ls-x.de/',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/119.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new BadGatewayException('Stock search provider failed');
    }

    const results = (await response.json()) as LangSchwarzSearchResult[];
    const suggestions = new Map<string, StockSuggestionCandidate>();

    for (const result of Array.isArray(results) ? results : []) {
      if (typeof result.isin !== 'string') continue;

      const symbol = normalizeSymbol(result.isin);
      if (!isSupportedLangSchwarzSymbol(symbol)) continue;

      const type = getInstrumentType(result);
      if (!type) continue;

      if (suggestions.has(symbol)) continue;

      suggestions.set(symbol, {
        rank: suggestions.size,
        suggestion: {
          symbol,
          name: result.displayname ?? symbol,
          type,
          logoUrl: buildFallbackLogoUrl(symbol),
        },
      });
    }

    return [...suggestions.values()]
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 8)
      .map((candidate) => candidate.suggestion);
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
    const normalizedSymbol = this.parseSupportedLangSchwarzSymbol(symbol);

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
    const normalizedSymbols =
      this.parseUniqueSupportedLangSchwarzSymbols(symbols);

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
    const normalizedSymbol = this.parseSupportedLangSchwarzSymbol(symbol);

    const range = this.parseChartRange(rangeInput);
    const status = await this.ensureBootstrapStartedIfNeeded(normalizedSymbol);

    if (range === '1D' || range === '1W' || range === '1M') {
      const timeFilterSql =
        range === '1D'
          ? this.getCurrentLangSchwarzDayFilterSql(normalizedSymbol)
          : this.getRollingIntradayFilterSql(normalizedSymbol, range);
      const rows = await this.prisma.$queryRaw<ChartRow[]>(Prisma.sql`
        SELECT
          EXTRACT(EPOCH FROM time)::bigint AS time,
          price::double precision AS price
        FROM prices_intraday
        ${timeFilterSql}
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

  async getStatistics(symbol: string): Promise<StockStatisticsResponse> {
    const normalizedSymbol = this.parseSupportedLangSchwarzSymbol(symbol);
    const cachedMeta = await this.getCachedStockMeta(normalizedSymbol);
    if (cachedMeta) return cachedMeta;

    const meta = await this.prisma.stockMeta.findUnique({
      where: { symbol: normalizedSymbol },
    });
    if (!meta) {
      await this.redisService.requestImmediateStockMeta(normalizedSymbol);
      return {
        symbol: normalizedSymbol,
        status: 'BOOTSTRAPPING',
        name: null,
        currency: null,
        exchange: null,
        previousClose: null,
        dayHigh: null,
        dayLow: null,
        fiftyTwoWeekHigh: null,
        fiftyTwoWeekLow: null,
        volume: null,
        updatedAt: null,
      };
    }

    return {
      symbol: normalizedSymbol,
      status: 'READY',
      name: meta.name,
      currency: meta.currency,
      exchange: meta.exchange,
      previousClose: meta.previousClose?.toNumber() ?? null,
      dayHigh: meta.dayHigh?.toNumber() ?? null,
      dayLow: meta.dayLow?.toNumber() ?? null,
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh?.toNumber() ?? null,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow?.toNumber() ?? null,
      volume: meta.volume && meta.volume > 0 ? meta.volume : null,
      updatedAt: meta.updatedAt,
    };
  }

  private async getCachedStockMeta(
    symbol: string,
  ): Promise<StockStatisticsResponse | null> {
    const meta = await this.redisService.getJson<CachedStockMeta>(
      `stockmeta:${symbol}`,
    );

    if (!meta) return null;

    return {
      symbol,
      status: 'READY',
      name: meta.name ?? null,
      currency: meta.currency ?? null,
      exchange: meta.exchange ?? null,
      previousClose: this.positiveNumberOrNull(meta.previousClose),
      dayHigh: this.positiveNumberOrNull(meta.dayHigh),
      dayLow: this.positiveNumberOrNull(meta.dayLow),
      fiftyTwoWeekHigh: this.positiveNumberOrNull(meta.fiftyTwoWeekHigh),
      fiftyTwoWeekLow: this.positiveNumberOrNull(meta.fiftyTwoWeekLow),
      volume:
        typeof meta.volume === 'number' && meta.volume > 0 ? meta.volume : null,
      updatedAt: null,
    };
  }

  private positiveNumberOrNull(value: unknown) {
    return typeof value === 'number' && Number.isFinite(value) && value > 0
      ? value
      : null;
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

  private parseSupportedLangSchwarzSymbol(symbol: string): string {
    const normalizedSymbol = normalizeSymbol(symbol);
    if (!normalizedSymbol) {
      throw new BadRequestException('Symbol is required');
    }
    if (!isSupportedLangSchwarzSymbol(normalizedSymbol)) {
      throw new BadRequestException(
        'Only Lang & Schwarz EUR instruments identified by ISIN are supported',
      );
    }

    return normalizedSymbol;
  }

  private parseUniqueSupportedLangSchwarzSymbols(symbols: string[]): string[] {
    return [
      ...new Set(
        symbols
          .map((symbol) => symbol.trim())
          .filter((symbol) => symbol.length > 0)
          .map((symbol) => this.parseSupportedLangSchwarzSymbol(symbol)),
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

    const latest = await this.redisService.getJson<LivePriceEvent>(
      `stocklatest:${symbol}`,
    );
    if (latest?.price && latest.price > 0) {
      onMessage(JSON.stringify(latest));
    }

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

  private getRollingIntradayFilterSql(symbol: string, range: '1W' | '1M') {
    const intervalSql = this.getIntradayIntervalSql(range);

    return Prisma.sql`
      WHERE symbol = ${symbol}
        AND time >= NOW() - ${intervalSql}
    `;
  }

  private getCurrentLangSchwarzDayFilterSql(symbol: string) {
    return Prisma.sql`
      WHERE symbol = ${symbol}
        AND time >= (
          DATE(NOW() AT TIME ZONE 'Europe/Berlin')
          AT TIME ZONE 'Europe/Berlin'
        )
        AND time < (
          (DATE(NOW() AT TIME ZONE 'Europe/Berlin') + INTERVAL '1 day')
          AT TIME ZONE 'Europe/Berlin'
        )
    `;
  }

  private getIntradayIntervalSql(range: '1W' | '1M') {
    switch (range) {
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
