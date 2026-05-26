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
import { PortfolioService } from '../portfolio/portfolio.service.js';

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
  dayHigh?: number;
  dayLow?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  intradayPoint?: GraphPoint;
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

type ChartRange = 'intraday' | '1M' | '6M' | '1Y' | '3Y' | 'ALL';

type GraphPoint = {
  time: number;
  price: number;
};

type ChartHistoryResponse = {
  symbol: string;
  range: ChartRange;
  source: 'intraday' | 'daily';
  points: GraphPoint[];
};

type StockStatisticsResponse = {
  symbol: string;
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

type LiveSubscription = {
  symbol: string;
  channel: string;
  onMessage: (message: string) => void;
};

const LANG_SCHWARZ_SEARCH_URL =
  'https://www.ls-tc.de/_rpc/json/.lstc/instrument/search/main';
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

const CHART_RANGES = ['intraday', '1M', '6M', '1Y', '3Y', 'ALL'] as const;
const LANG_SCHWARZ_TIME_ZONE = 'Europe/Berlin';

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
    private readonly portfolioService: PortfolioService,
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
        Referer: 'https://www.ls-tc.de/',
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

  async getWatchlistStocks(userId: string): Promise<DiscoverStock[]> {
    const portfolio = await this.portfolioService.getActivePortfolioForUser(
      userId,
    );
    const items = await this.prisma.watchlistItem.findMany({
      where: { portfolioId: portfolio.id },
      orderBy: { createdAt: 'asc' },
    });

    return Promise.all(items.map((item) => this.mapStockBySymbol(item.symbol)));
  }

  async addToWatchlist(userId: string, symbol: string): Promise<DiscoverStock> {
    const portfolio = await this.portfolioService.getActivePortfolioForUser(
      userId,
    );
    const normalizedSymbol = this.parseSupportedLangSchwarzSymbol(symbol);

    await this.prisma.watchlistItem.upsert({
      where: {
        portfolioId_symbol: {
          portfolioId: portfolio.id,
          symbol: normalizedSymbol,
        },
      },
      create: {
        portfolioId: portfolio.id,
        symbol: normalizedSymbol,
      },
      update: {},
    });
    await this.redisService.requestImmediateLivePrice(normalizedSymbol);

    return this.mapStockBySymbol(normalizedSymbol);
  }

  async removeFromWatchlist(userId: string, symbol: string) {
    const portfolio = await this.portfolioService.getActivePortfolioForUser(
      userId,
    );
    const normalizedSymbol = this.parseSupportedLangSchwarzSymbol(symbol);

    await this.prisma.watchlistItem.deleteMany({
      where: {
        portfolioId: portfolio.id,
        symbol: normalizedSymbol,
      },
    });

    return { symbol: normalizedSymbol };
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
    await this.redisService.requestImmediateLivePrice(normalizedSymbol);

    if (range === 'intraday') {
      const [rows, previousClose] = await Promise.all([
        this.prisma.$queryRaw<ChartRow[]>(Prisma.sql`
        SELECT
          EXTRACT(EPOCH FROM time)::bigint AS time,
          price::double precision AS price
        FROM prices_intraday
        ${this.getCurrentLangSchwarzDayFilterSql(normalizedSymbol)}
        ORDER BY time ASC
      `),
        this.getPreviousClose(normalizedSymbol),
      ]);
      const points = rows.map((row) => this.mapChartRow(row));

      return {
        symbol: normalizedSymbol,
        range,
        source: 'intraday',
        points: this.prependIntradayBaseline(points, previousClose),
      };
    }

    const rows = await this.prisma.$queryRaw<ChartRow[]>(Prisma.sql`
      SELECT
        EXTRACT(EPOCH FROM (date::timestamp AT TIME ZONE 'UTC'))::bigint AS time,
        price::double precision AS price
      FROM prices_daily
      ${this.getDailyRangeFilterSql(normalizedSymbol, range)}
      ORDER BY date ASC
    `);
    const points = rows.map((row) => this.mapChartRow(row));
    const latestPrice = await this.getCachedLivePrice(normalizedSymbol);

    return {
      symbol: normalizedSymbol,
      range,
      source: 'daily',
      points: this.applyLatestPriceToLastPoint(points, latestPrice),
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
      await this.redisService.requestImmediateLivePrice(normalizedSymbol);
      return {
        symbol: normalizedSymbol,
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

  private async mapStockBySymbol(symbol: string): Promise<DiscoverStock> {
    const definition = DISCOVER_STOCKS.find((stock) => stock.ticker === symbol);
    const [latest, meta] = await Promise.all([
      this.redisService.getJson<LivePriceEvent>(`stocklatest:${symbol}`),
      definition
        ? Promise.resolve(null)
        : this.prisma.stockMeta.findUnique({ where: { symbol } }),
    ]);

    return this.mapDiscoverStock(
      {
        name: definition?.name ?? meta?.name ?? symbol,
        ticker: symbol,
        logo: definition?.logo ?? buildFallbackLogoUrl(symbol),
      },
      latest,
    );
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
    const trimmedRange = rangeInput.trim();
    const normalizedRange =
      trimmedRange.length > 0 ? trimmedRange.toUpperCase() : 'INTRADAY';

    switch (normalizedRange) {
      case 'INTRADAY':
        return 'intraday';
      case '1M':
      case '6M':
      case '1Y':
      case '3Y':
      case 'ALL':
        return normalizedRange;
    }

    throw new BadRequestException(
      `Invalid range. Allowed values: ${CHART_RANGES.join(', ')}`,
    );
  }

  private getDailyRangeFilterSql(
    symbol: string,
    range: Exclude<ChartRange, 'intraday'>,
  ) {
    return Prisma.sql`
      WHERE symbol = ${symbol}
        ${this.getDailyRangeIntervalSql(range)}
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

  private getDailyRangeIntervalSql(range: Exclude<ChartRange, 'intraday'>) {
    switch (range) {
      case '1M':
        return Prisma.sql`AND date >= CURRENT_DATE - INTERVAL '1 month'`;
      case '6M':
        return Prisma.sql`AND date >= CURRENT_DATE - INTERVAL '6 months'`;
      case '1Y':
        return Prisma.sql`AND date >= CURRENT_DATE - INTERVAL '1 year'`;
      case '3Y':
        return Prisma.sql`AND date >= CURRENT_DATE - INTERVAL '3 years'`;
      case 'ALL':
        return Prisma.sql``;
    }
  }

  private mapChartRow(row: ChartRow): GraphPoint {
    return {
      time: Number(row.time),
      price: Number(row.price),
    };
  }

  private async getCachedLivePrice(symbol: string) {
    const latest = await this.redisService.getJson<LivePriceEvent>(
      `stocklatest:${symbol}`,
    );

    return typeof latest?.price === 'number' && latest.price > 0
      ? latest.price
      : null;
  }

  private async getPreviousClose(symbol: string) {
    const latest = await this.redisService.getJson<LivePriceEvent>(
      `stocklatest:${symbol}`,
    );

    if (typeof latest?.previousClose === 'number' && latest.previousClose > 0) {
      return latest.previousClose;
    }

    const meta = await this.prisma.stockMeta.findUnique({
      where: { symbol },
      select: { previousClose: true },
    });

    return meta?.previousClose?.toNumber() ?? null;
  }

  private prependIntradayBaseline(
    points: GraphPoint[],
    previousClose: number | null,
  ) {
    if (points.length === 0 || previousClose == null || previousClose <= 0) {
      return points;
    }

    const firstPoint = points[0];
    const { year, month, day } = this.getZonedDateParts(
      new Date(firstPoint.time * 1000),
      LANG_SCHWARZ_TIME_ZONE,
    );
    const dayStart = Math.floor(
      this.zonedDateTimeToUtcDate(
        LANG_SCHWARZ_TIME_ZONE,
        year,
        month,
        day,
        7,
      ).getTime() / 1000,
    );

    return [
      {
        time: Math.max(dayStart, firstPoint.time - 1),
        price: previousClose,
      },
      ...points,
    ];
  }

  private getZonedDateParts(date: Date, timeZone: string) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);
    const partValue = (type: string) =>
      Number(parts.find((part) => part.type === type)?.value);

    return {
      year: partValue('year'),
      month: partValue('month'),
      day: partValue('day'),
    };
  }

  private zonedDateTimeToUtcDate(
    timeZone: string,
    year: number,
    month: number,
    day: number,
    hour: number,
  ) {
    const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, 0, 0, 0));
    const offset = this.getTimeZoneOffsetMs(timeZone, utcGuess);
    const correctedDate = new Date(utcGuess.getTime() - offset);
    const correctedOffset = this.getTimeZoneOffsetMs(timeZone, correctedDate);

    return new Date(utcGuess.getTime() - correctedOffset);
  }

  private getTimeZoneOffsetMs(timeZone: string, date: Date) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).formatToParts(date);
    const partValue = (type: string) =>
      Number(parts.find((part) => part.type === type)?.value);
    const zonedAsUtc = Date.UTC(
      partValue('year'),
      partValue('month') - 1,
      partValue('day'),
      partValue('hour'),
      partValue('minute'),
      partValue('second'),
    );

    return zonedAsUtc - date.getTime();
  }

  private applyLatestPriceToLastPoint(
    points: GraphPoint[],
    latestPrice: number | null,
  ) {
    if (points.length === 0 || latestPrice == null || latestPrice <= 0) {
      return points;
    }

    const nextPoints = [...points];
    nextPoints[nextPoints.length - 1] = {
      ...nextPoints[nextPoints.length - 1],
      price: latestPrice,
    };

    return nextPoints;
  }
}
