import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  MessageEvent,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Observable } from 'rxjs';
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
  bootstrapDone?: boolean;
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

const QUOTE_TYPE_LABELS = {
  EQUITY: 'STOCK',
  ETF: 'ETF',
  CRYPTOCURRENCY: 'CRYPTO',
} as const;

type SupportedQuoteType = keyof typeof QUOTE_TYPE_LABELS;

function isSupportedQuoteType(value: string): value is SupportedQuoteType {
  return value in QUOTE_TYPE_LABELS;
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
      quotesCount: '8',
      newsCount: '0',
      enableLogoUrl: 'true',
      lang: 'en-US',
      region: 'US',
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

    return quotes
      .filter(
        (
          quote,
        ): quote is YahooQuote & {
          symbol: string;
          quoteType: SupportedQuoteType;
        } =>
          typeof quote.symbol === 'string' &&
          typeof quote.quoteType === 'string' &&
          isSupportedQuoteType(quote.quoteType),
      )
      .map((quote) => ({
        symbol: quote.symbol,
        name: quote.shortname || quote.longname || '',
        type: QUOTE_TYPE_LABELS[quote.quoteType],
        logoUrl: quote.logoUrl ?? buildFallbackLogoUrl(quote.symbol),
      }));
  }

  streamLivePrice(symbol: string): Observable<MessageEvent> {
    const normalizedSymbol = symbol.trim().toUpperCase();

    return new Observable<MessageEvent>((subscriber) => {
      if (!normalizedSymbol) {
        subscriber.error(new Error('Symbol is required'));
        return;
      }

      const channel = `stocklive:${normalizedSymbol}`;
      const onMessage = (message: string) => {
        try {
          const payload = JSON.parse(message) as LivePriceEvent;
          subscriber.next({
            data: payload,
          });
        } catch {
          subscriber.next({
            data: {
              symbol: normalizedSymbol,
              raw: message,
            },
          });
        }
      };

      void (async () => {
        await this.redisService.subscribe(channel, onMessage);
        await this.redisService.incrementActiveSubscriber(normalizedSymbol);
        await this.redisService.markSymbolActive(normalizedSymbol);
        await this.redisService.requestImmediateLivePrice(normalizedSymbol);
      })().catch((error: unknown) => {
        subscriber.error(error);
      });

      return () => {
        void this.redisService.unsubscribe(channel, onMessage);
        void this.redisService.decrementActiveSubscriber(normalizedSymbol);
      };
    });
  }

  async getChartHistory(
    symbol: string,
    rangeInput: string,
  ): Promise<ChartHistoryResponse> {
    const normalizedSymbol = symbol.trim().toUpperCase();
    if (!normalizedSymbol) {
      throw new BadRequestException('Symbol is required');
    }

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

    const lockExists = await this.redisService.exists(
      `bootstraplock:${symbol}`,
    );
    if (!lockExists) {
      await this.redisService.enqueueBootstrap(symbol);
    }

    return 'BOOTSTRAPPING';
  }

  private parseChartRange(rangeInput: string): ChartRange {
    const normalizedRange = rangeInput.trim().toUpperCase() || '1D';

    if (
      normalizedRange === '1D' ||
      normalizedRange === '1W' ||
      normalizedRange === '1M' ||
      normalizedRange === '1Y' ||
      normalizedRange === 'ALL'
    ) {
      return normalizedRange;
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
