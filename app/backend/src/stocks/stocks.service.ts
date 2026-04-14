import { BadGatewayException, Injectable, MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
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
  constructor(private redisService: RedisService) {}

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

      void this.redisService.incrementActiveSubscriber(normalizedSymbol);
      void this.redisService.markSymbolActive(normalizedSymbol);
      void this.redisService
        .subscribe(channel, onMessage)
        .catch((error: unknown) => {
          subscriber.error(error);
        });

      return () => {
        void this.redisService.unsubscribe(channel);
        void this.redisService.decrementActiveSubscriber(normalizedSymbol);
      };
    });
  }
}
