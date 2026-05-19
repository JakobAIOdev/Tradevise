import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { BuyStockDto } from './dto/buy-stock.dto.js';
import { SellStockDto } from './dto/sell-stock.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';

type LivePriceEvent = {
  symbol: string;
  price?: number;
  previousClose?: number;
};

type TodayTransaction = {
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
};

type ChartRange = 'intraday' | '1M' | '6M' | '1Y' | '3Y' | 'ALL';

type PortfolioChartResponse = {
  symbol: string;
  range: ChartRange;
  source: 'intraday' | 'daily';
  points: Array<{
    time: number;
    price: number;
  }>;
};

type PortfolioChartTransaction = {
  symbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  total: number;
  time: number;
};

type PortfolioPriceHistory = {
  points: Array<{
    time: number;
    price: number;
  }>;
  previousPrice: number | null;
};

type PortfolioChartState = {
  cash: number;
  quantities: Map<string, number>;
  latestKnownPrices: Map<string, number>;
};

type LeaderboardMetric = 'total' | 'seasonal';

type LeaderboardBaseline = {
  userId: string;
  baselineDate: Date;
};

@Injectable()
export class PortfolioService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async getPortfolio(userId: string) {
    const portfolio = await this.ensurePortfolio(userId);
    const holdings = await this.prisma.portfolioHolding.findMany({
      where: { userId },
      orderBy: { symbol: 'asc' },
    });
    const todayTransactions = await this.getTodayTransactionsBySymbol(userId);

    const enrichedHoldings = await Promise.all(
      holdings.map(async (holding) => {
        const currentPrice = await this.getDisplayPrice(holding.symbol);
        const previousClose = await this.getPreviousClose(holding.symbol);
        const quantity = this.toNumber(holding.quantity);
        const averagePrice = this.toNumber(holding.averagePrice);
        const todayPerformance = this.calculateTodayPerformance({
          currentPrice,
          currentQuantity: quantity,
          previousClose,
          transactions: todayTransactions.get(holding.symbol) ?? [],
        });

        return {
          id: holding.id,
          symbol: holding.symbol,
          quantity,
          averagePrice,
          currentPrice,
          previousClose,
          marketValue: quantity * currentPrice,
          profitLoss: quantity * (currentPrice - averagePrice),
          todayChange: todayPerformance.change,
          todayBaselineValue: todayPerformance.baselineValue,
        };
      }),
    );

    const holdingsValue = enrichedHoldings.reduce(
      (sum, holding) => sum + holding.marketValue,
      0,
    );
    const todayChange = enrichedHoldings.reduce(
      (sum, holding) => sum + holding.todayChange,
      0,
    );
    const todayBaselineValue = enrichedHoldings.reduce(
      (sum, holding) => sum + holding.todayBaselineValue,
      0,
    );
    const todayChangePercent =
      todayBaselineValue > 0 ? (todayChange / todayBaselineValue) * 100 : 0;
    const cash = this.toNumber(portfolio.cash);

    return {
      userId,
      cash,
      holdingsValue,
      totalValue: cash + holdingsValue,
      todayChange,
      todayChangePercent,
      todayBaselineValue,
      holdings: enrichedHoldings,
    };
  }

  async getPortfolioChart(
    userId: string,
    rangeInput: string,
  ): Promise<PortfolioChartResponse> {
    const range = this.parsePortfolioChartRange(rangeInput);
    const portfolio = await this.ensurePortfolio(userId);
    const { start, end, source } = this.getPortfolioChartWindow(range);
    const resolvedStart =
      range === 'ALL'
        ? await this.resolveAllRangeStart(userId, portfolio.createdAt)
        : start;
    const timelineEnd =
      source === 'intraday' ? this.toIntradayChartDate(end) : end;

    const normalizedTransactions = await this.loadPortfolioChartTransactions(
      userId,
      end,
      source,
    );

    if (normalizedTransactions.length === 0) {
      return {
        symbol: 'PORTFOLIO',
        range,
        source,
        points: [
          {
            time: Math.floor(end.getTime() / 1000),
            price: this.toNumber(portfolio.cash),
          },
        ],
      };
    }

    const symbols = this.extractPortfolioChartSymbols(normalizedTransactions);

    const priceHistoryBySymbol = await this.getPortfolioPriceHistory(
      symbols,
      resolvedStart,
      timelineEnd,
      source,
    );
    const [livePricesBySymbol, previousCloseBySymbol] = await Promise.all([
      this.getLivePricesBySymbol(symbols),
      source === 'intraday'
        ? this.getPreviousClosesBySymbol(symbols)
        : Promise.resolve(new Map<string, number | null>()),
    ]);

    const initialCash = this.deriveInitialCash(
      this.toNumber(portfolio.cash),
      normalizedTransactions,
    );
    const rangeStartTimestamp = Math.floor(resolvedStart.getTime() / 1000);
    const rangeEndTimestamp = Math.floor(timelineEnd.getTime() / 1000);
    const state = this.seedPortfolioChartState({
      symbols,
      initialCash,
      normalizedTransactions,
      priceHistoryBySymbol,
      livePricesBySymbol,
      previousCloseBySymbol,
      source,
      rangeStartTimestamp,
    });
    const timeline = this.buildPortfolioTimeline({
      normalizedTransactions,
      priceHistoryBySymbol,
      livePricesBySymbol,
      source,
      rangeStartTimestamp,
      rangeEndTimestamp,
    });
    const points = this.calculatePortfolioChartPoints({
      timeline,
      state,
      source,
      rangeStartTimestamp,
    });

    return {
      symbol: 'PORTFOLIO',
      range,
      source,
      points,
    };
  }

  async getLeaderboard(userId: string, metricInput = 'total') {
    return this.buildLeaderboard(userId, metricInput);
  }

  async getLeaderboardForUsers(
    userId: string,
    userIds: string[],
    metricInput = 'total',
  ) {
    return this.buildLeaderboard(userId, metricInput, {
      id: { in: userIds },
    });
  }

  async getLeaderboardForUsersSince(
    userId: string,
    baselines: LeaderboardBaseline[],
    metricInput = 'total',
  ) {
    const userIds = baselines.map((baseline) => baseline.userId);
    const baselineDatesByUserId = new Map(
      baselines.map((baseline) => [baseline.userId, baseline.baselineDate]),
    );

    return this.buildLeaderboard(
      userId,
      metricInput,
      {
        id: { in: userIds },
      },
      baselineDatesByUserId,
    );
  }

  private async buildLeaderboard(
    userId: string,
    metricInput: string,
    userWhere?: Prisma.UserWhereInput,
    baselineDatesByUserId?: Map<string, Date>,
  ) {
    const metric = this.parseLeaderboardMetric(metricInput);
    await this.ensurePortfolio(userId);

    const users = await this.prisma.user.findMany({
      where: userWhere,
      select: {
        id: true,
        username: true,
        portfolios: {
          select: {
            cash: true,
            createdAt: true,
          },
          take: 1,
        },
        holdings: {
          select: {
            symbol: true,
            quantity: true,
          },
        },
      },
    });

    const ranked = await Promise.all(
      users
        .filter((user) => user.portfolios.length > 0)
        .map(async (user) => {
          const portfolio = user.portfolios[0];

          const totalValue = await this.calculateCurrentPortfolioValue(
            portfolio.cash,
            user.holdings,
          );

          const seasonGainPercent =
            metric === 'seasonal'
              ? await this.calculateGainPercentSinceDate({
                  userId: user.id,
                  currentTotalValue: totalValue,
                  currentCash: this.toNumber(portfolio.cash),
                  holdings: user.holdings,
                  portfolioCreatedAt: portfolio.createdAt,
                  baselineDate:
                    baselineDatesByUserId?.get(user.id) ??
                    this.getCurrentSeasonStart(),
                })
              : null;

          return {
            userId: user.id,
            username: user.username,
            totalValue,
            seasonGainPercent,
          };
        }),
    );

    const entries = ranked
      .sort((left, right) => {
        const leftValue =
          metric === 'seasonal'
            ? (left.seasonGainPercent ?? Number.NEGATIVE_INFINITY)
            : left.totalValue;

        const rightValue =
          metric === 'seasonal'
            ? (right.seasonGainPercent ?? Number.NEGATIVE_INFINITY)
            : right.totalValue;

        return rightValue - leftValue;
      })
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
        isCurrentUser: entry.userId === userId,
      }));

    return {
      metric,
      seasonStart: this.getCurrentSeasonStart(),
      entries,
    };
  }

  async buyStock(userId: string, dto: BuyStockDto) {
    const symbol = this.normalizeSymbol(dto.symbol);
    const quantity = this.toDecimal(dto.quantity);
    const price = this.toDecimal(await this.getTradePrice(symbol));
    const total = quantity.mul(price);

    return this.prisma.$transaction(async (tx) => {
      const portfolio = await tx.portfolio.upsert({
        where: { userId },
        create: { userId },
        update: {},
      });

      if (portfolio.cash.lt(total)) {
        throw new BadRequestException('Not enough cash to buy this stock');
      }

      const existingHolding = await tx.portfolioHolding.findUnique({
        where: { userId_symbol: { userId, symbol } },
      });

      const holding = existingHolding
        ? await tx.portfolioHolding.update({
            where: { id: existingHolding.id },
            data: {
              quantity: existingHolding.quantity.add(quantity),
              averagePrice: existingHolding.quantity
                .mul(existingHolding.averagePrice)
                .add(quantity.mul(price))
                .div(existingHolding.quantity.add(quantity)),
            },
          })
        : await tx.portfolioHolding.create({
            data: {
              userId,
              symbol,
              quantity,
              averagePrice: price,
            },
          });

      const transaction = await tx.transaction.create({
        data: {
          userId,
          symbol,
          type: 'BUY',
          quantity,
          price,
          total,
        },
      });

      const updatedPortfolio = await tx.portfolio.update({
        where: { userId },
        data: { cash: portfolio.cash.sub(total) },
      });

      return this.mapTradeResult(updatedPortfolio.cash, holding, transaction);
    });
  }

  async sellStock(userId: string, dto: SellStockDto) {
    const symbol = this.normalizeSymbol(dto.symbol);
    const quantity = this.toDecimal(dto.quantity);
    const price = this.toDecimal(await this.getTradePrice(symbol));
    const total = quantity.mul(price);

    return this.prisma.$transaction(async (tx) => {
      const portfolio = await tx.portfolio.upsert({
        where: { userId },
        create: { userId },
        update: {},
      });

      const existingHolding = await tx.portfolioHolding.findUnique({
        where: { userId_symbol: { userId, symbol } },
      });

      if (!existingHolding || existingHolding.quantity.lt(quantity)) {
        throw new BadRequestException('Not enough shares to sell');
      }

      const remainingQuantity = existingHolding.quantity.sub(quantity);
      const holding = remainingQuantity.equals(0)
        ? await tx.portfolioHolding.delete({
            where: { id: existingHolding.id },
          })
        : await tx.portfolioHolding.update({
            where: { id: existingHolding.id },
            data: { quantity: remainingQuantity },
          });

      const transaction = await tx.transaction.create({
        data: {
          userId,
          symbol,
          type: 'SELL',
          quantity,
          price,
          total,
        },
      });

      const updatedPortfolio = await tx.portfolio.update({
        where: { userId },
        data: { cash: portfolio.cash.add(total) },
      });

      return this.mapTradeResult(updatedPortfolio.cash, holding, transaction);
    });
  }

  async getTransactions(userId: string) {
    const transactions = await this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      userId,
      transactions: transactions.map((transaction) => ({
        id: transaction.id,
        symbol: transaction.symbol,
        type: transaction.type,
        quantity: this.toNumber(transaction.quantity),
        price: this.toNumber(transaction.price),
        total: this.toNumber(transaction.total),
        createdAt: transaction.createdAt,
      })),
    };
  }

  private normalizeSymbol(symbol: string) {
    const normalized = symbol.trim().toUpperCase();

    if (!normalized) {
      throw new BadRequestException('Symbol is required');
    }

    return normalized;
  }

  private parseLeaderboardMetric(metricInput: string): LeaderboardMetric {
    const metric = metricInput.trim().toLowerCase();

    if (metric === 'seasonal') return 'seasonal';
    if (metric === '' || metric === 'total') return 'total';

    throw new BadRequestException(
      'Invalid leaderboard metric. Allowed values: total, seasonal',
    );
  }

  private async calculateCurrentPortfolioValue(
    cash: Prisma.Decimal,
    holdings: Array<{ symbol: string; quantity: Prisma.Decimal }>,
  ) {
    const holdingsValue = await this.calculateHoldingsValue(holdings);
    return this.toNumber(cash) + holdingsValue;
  }

  private async calculateHoldingsValue(
    holdings: Array<{ symbol: string; quantity: Prisma.Decimal }>,
  ) {
    const values = await Promise.all(
      holdings.map(async (holding) => {
        const currentPrice = await this.getDisplayPrice(holding.symbol);
        return this.toNumber(holding.quantity) * currentPrice;
      }),
    );

    return values.reduce((sum, value) => sum + value, 0);
  }

  private async calculateGainPercentSinceDate({
    userId,
    currentTotalValue,
    currentCash,
    holdings,
    portfolioCreatedAt,
    baselineDate,
  }: {
    userId: string;
    currentTotalValue: number;
    currentCash: number;
    holdings: Array<{ symbol: string; quantity: Prisma.Decimal }>;
    portfolioCreatedAt: Date;
    baselineDate: Date;
  }) {
    const effectiveBaselineDate =
      portfolioCreatedAt > baselineDate ? portfolioCreatedAt : baselineDate;
    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        createdAt: {
          gte: effectiveBaselineDate,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        symbol: true,
        type: true,
        quantity: true,
        total: true,
      },
    });

    let baselineCash = currentCash;
    const baselineQuantities = new Map(
      holdings.map((holding) => [
        holding.symbol,
        this.toNumber(holding.quantity),
      ]),
    );

    for (const transaction of transactions) {
      const quantity = this.toNumber(transaction.quantity);
      const currentQuantity = baselineQuantities.get(transaction.symbol) ?? 0;

      if (transaction.type === 'BUY') {
        baselineCash += this.toNumber(transaction.total);
        baselineQuantities.set(
          transaction.symbol,
          Math.max(currentQuantity - quantity, 0),
        );
      } else {
        baselineCash -= this.toNumber(transaction.total);
        baselineQuantities.set(transaction.symbol, currentQuantity + quantity);
      }
    }

    const baselineHoldings = [...baselineQuantities.entries()]
      .filter(([, quantity]) => quantity > 0)
      .map(([symbol, quantity]) => ({ symbol, quantity }));
    const baselineHoldingsValue = await this.calculateHistoricalHoldingsValue(
      baselineHoldings,
      effectiveBaselineDate,
    );
    const baselineValue = baselineCash + baselineHoldingsValue;

    if (baselineValue <= 0) return null;

    return ((currentTotalValue - baselineValue) / baselineValue) * 100;
  }

  private async calculateHistoricalHoldingsValue(
    holdings: Array<{ symbol: string; quantity: number }>,
    date: Date,
  ) {
    const values = await Promise.all(
      holdings.map(async (holding) => {
        const price = await this.getHistoricalDisplayPrice(
          holding.symbol,
          date,
        );
        return holding.quantity * price;
      }),
    );

    return values.reduce((sum, value) => sum + value, 0);
  }

  private async getHistoricalDisplayPrice(symbol: string, date: Date) {
    const dailyPrice = await this.prisma.priceDaily.findFirst({
      where: {
        symbol,
        date: {
          lte: date,
        },
      },
      orderBy: {
        date: 'desc',
      },
      select: {
        price: true,
      },
    });

    if (dailyPrice) return this.toNumber(dailyPrice.price);

    return this.getDisplayPrice(symbol);
  }

  private getCurrentSeasonStart() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  private async ensurePortfolio(userId: string) {
    return this.prisma.portfolio.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }

  private async getTodayTransactionsBySymbol(userId: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        createdAt: { gte: todayStart },
      },
      orderBy: { createdAt: 'asc' },
      select: {
        symbol: true,
        type: true,
        quantity: true,
        price: true,
      },
    });

    const transactionsBySymbol = new Map<string, TodayTransaction[]>();

    for (const transaction of transactions) {
      const existing = transactionsBySymbol.get(transaction.symbol) ?? [];
      existing.push({
        type: transaction.type,
        quantity: this.toNumber(transaction.quantity),
        price: this.toNumber(transaction.price),
      });
      transactionsBySymbol.set(transaction.symbol, existing);
    }

    return transactionsBySymbol;
  }

  private calculateTodayPerformance({
    currentPrice,
    currentQuantity,
    previousClose,
    transactions,
  }: {
    currentPrice: number;
    currentQuantity: number;
    previousClose: number | null;
    transactions: TodayTransaction[];
  }) {
    const boughtToday = transactions
      .filter((transaction) => transaction.type === 'BUY')
      .reduce((sum, transaction) => sum + transaction.quantity, 0);
    const soldToday = transactions
      .filter((transaction) => transaction.type === 'SELL')
      .reduce((sum, transaction) => sum + transaction.quantity, 0);
    const startingQuantity = Math.max(
      currentQuantity - boughtToday + soldToday,
      0,
    );
    const startingBaseline =
      previousClose && previousClose > 0 ? previousClose : currentPrice;
    const lots: { quantity: number; baseline: number }[] =
      startingQuantity > 0
        ? [{ quantity: startingQuantity, baseline: startingBaseline }]
        : [];
    let change = 0;
    let baselineValue = startingQuantity * startingBaseline;

    for (const transaction of transactions) {
      if (transaction.type === 'BUY') {
        lots.push({
          quantity: transaction.quantity,
          baseline: transaction.price,
        });
        baselineValue += transaction.quantity * transaction.price;
        continue;
      }

      let remainingToSell = transaction.quantity;
      while (remainingToSell > 0 && lots.length > 0) {
        const lot = lots[0];
        const soldQuantity = Math.min(lot.quantity, remainingToSell);
        change += soldQuantity * (transaction.price - lot.baseline);
        lot.quantity -= soldQuantity;
        remainingToSell -= soldQuantity;

        if (lot.quantity <= 0) {
          lots.shift();
        }
      }
    }

    change += lots.reduce(
      (sum, lot) => sum + lot.quantity * (currentPrice - lot.baseline),
      0,
    );

    return { change, baselineValue };
  }

  private async resolveAllRangeStart(userId: string, fallbackDate: Date) {
    const firstTransaction = await this.prisma.transaction.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    });

    const start = new Date(firstTransaction?.createdAt ?? fallbackDate);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  private async loadPortfolioChartTransactions(
    userId: string,
    end: Date,
    source: 'intraday' | 'daily',
  ) {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        createdAt: {
          lte: end,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        symbol: true,
        type: true,
        quantity: true,
        price: true,
        total: true,
        createdAt: true,
      },
    });

    return transactions.map(
      (transaction): PortfolioChartTransaction => ({
        symbol: transaction.symbol,
        type: transaction.type,
        quantity: this.toNumber(transaction.quantity),
        price: this.toNumber(transaction.price),
        total: this.toNumber(transaction.total),
        time: Math.floor(
          (source === 'intraday'
            ? this.toIntradayChartDate(transaction.createdAt)
            : transaction.createdAt
          ).getTime() / 1000,
        ),
      }),
    );
  }

  private extractPortfolioChartSymbols(
    transactions: PortfolioChartTransaction[],
  ) {
    return [...new Set(transactions.map((transaction) => transaction.symbol))];
  }

  private seedPortfolioChartState({
    symbols,
    initialCash,
    normalizedTransactions,
    priceHistoryBySymbol,
    livePricesBySymbol,
    previousCloseBySymbol,
    source,
    rangeStartTimestamp,
  }: {
    symbols: string[];
    initialCash: number;
    normalizedTransactions: PortfolioChartTransaction[];
    priceHistoryBySymbol: Map<string, PortfolioPriceHistory>;
    livePricesBySymbol: Map<string, number | null>;
    previousCloseBySymbol: Map<string, number | null>;
    source: 'intraday' | 'daily';
    rangeStartTimestamp: number;
  }): PortfolioChartState {
    const quantities = new Map<string, number>();
    const latestKnownPrices = new Map<string, number>();
    let cash = initialCash;

    for (const symbol of symbols) {
      const history = priceHistoryBySymbol.get(symbol);
      const fallbackPrice = this.getInitialChartPrice(
        history,
        livePricesBySymbol.get(symbol) ?? null,
        previousCloseBySymbol.get(symbol) ?? null,
        source,
      );

      if (typeof fallbackPrice === 'number' && fallbackPrice > 0) {
        latestKnownPrices.set(symbol, fallbackPrice);
      }
    }

    for (const transaction of normalizedTransactions) {
      if (transaction.time >= rangeStartTimestamp) break;

      cash = this.applyCashDelta(cash, transaction);
      this.applyTransactionToPortfolioState(
        quantities,
        latestKnownPrices,
        transaction,
        { updatePrice: false },
      );
    }

    return { cash, quantities, latestKnownPrices };
  }

  private getInitialChartPrice(
    history: PortfolioPriceHistory | undefined,
    livePrice: number | null,
    previousClose: number | null,
    source: 'intraday' | 'daily',
  ) {
    if (source === 'intraday') {
      return previousClose ?? history?.points[0]?.price ?? livePrice ?? null;
    }

    return history?.previousPrice ?? history?.points[0]?.price ?? livePrice;
  }

  private buildPortfolioTimeline({
    normalizedTransactions,
    priceHistoryBySymbol,
    livePricesBySymbol,
    source,
    rangeStartTimestamp,
    rangeEndTimestamp,
  }: {
    normalizedTransactions: PortfolioChartTransaction[];
    priceHistoryBySymbol: Map<string, PortfolioPriceHistory>;
    livePricesBySymbol: Map<string, number | null>;
    source: 'intraday' | 'daily';
    rangeStartTimestamp: number;
    rangeEndTimestamp: number;
  }) {
    const priceEventsByTime = new Map<
      number,
      Array<{ symbol: string; price: number }>
    >();
    const transactionEventsByTime = new Map<
      number,
      PortfolioChartTransaction[]
    >();

    for (const [symbol, history] of priceHistoryBySymbol.entries()) {
      for (const point of history.points) {
        if (
          point.time < rangeStartTimestamp ||
          point.time > rangeEndTimestamp
        ) {
          continue;
        }

        const eventsAtTime = priceEventsByTime.get(point.time) ?? [];
        eventsAtTime.push({ symbol, price: point.price });
        priceEventsByTime.set(point.time, eventsAtTime);
      }
    }

    for (const transaction of normalizedTransactions) {
      if (
        transaction.time < rangeStartTimestamp ||
        transaction.time > rangeEndTimestamp
      ) {
        continue;
      }

      const eventsAtTime = transactionEventsByTime.get(transaction.time) ?? [];
      eventsAtTime.push(transaction);
      transactionEventsByTime.set(transaction.time, eventsAtTime);
    }

    if (source === 'daily') {
      for (const [symbol, livePrice] of livePricesBySymbol.entries()) {
        if (typeof livePrice !== 'number' || livePrice <= 0) continue;

        const eventsAtTime = priceEventsByTime.get(rangeEndTimestamp) ?? [];
        eventsAtTime.push({ symbol, price: livePrice });
        priceEventsByTime.set(rangeEndTimestamp, eventsAtTime);
      }
    }

    const timestamps =
      source === 'intraday'
        ? [
            ...new Set([
              ...priceEventsByTime.keys(),
              ...transactionEventsByTime.keys(),
            ]),
          ].sort((left, right) => left - right)
        : [
            ...new Set([
              rangeStartTimestamp,
              rangeEndTimestamp,
              ...priceEventsByTime.keys(),
              ...transactionEventsByTime.keys(),
            ]),
          ].sort((left, right) => left - right);

    return {
      timestamps,
      priceEventsByTime,
      transactionEventsByTime,
    };
  }

  private calculatePortfolioChartPoints({
    timeline,
    state,
    source,
    rangeStartTimestamp,
  }: {
    timeline: {
      timestamps: number[];
      priceEventsByTime: Map<number, Array<{ symbol: string; price: number }>>;
      transactionEventsByTime: Map<number, PortfolioChartTransaction[]>;
    };
    state: PortfolioChartState;
    source: 'intraday' | 'daily';
    rangeStartTimestamp: number;
  }) {
    const points: Array<{ time: number; price: number }> = [];
    const { timestamps, priceEventsByTime, transactionEventsByTime } = timeline;
    let cash = state.cash;
    const quantities = new Map(state.quantities);
    const latestKnownPrices = new Map(state.latestKnownPrices);

    if (source === 'intraday') {
      points.push({
        time: rangeStartTimestamp,
        price: this.calculatePortfolioValue(
          cash,
          quantities,
          latestKnownPrices,
        ),
      });
    }

    for (const timestamp of timestamps) {
      for (const priceEvent of priceEventsByTime.get(timestamp) ?? []) {
        latestKnownPrices.set(priceEvent.symbol, priceEvent.price);
      }

      for (const transaction of transactionEventsByTime.get(timestamp) ?? []) {
        cash = this.applyCashDelta(cash, transaction);
        this.applyTransactionToPortfolioState(
          quantities,
          latestKnownPrices,
          transaction,
        );
      }

      points.push({
        time: timestamp,
        price: this.calculatePortfolioValue(
          cash,
          quantities,
          latestKnownPrices,
        ),
      });
    }

    return points;
  }

  private parsePortfolioChartRange(rangeInput: string): ChartRange {
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
      'Invalid range. Allowed values: intraday, 1M, 6M, 1Y, 3Y, ALL',
    );
  }

  private getPortfolioChartWindow(range: ChartRange) {
    const end = new Date();
    const start = new Date(end);

    switch (range) {
      case 'intraday':
        start.setUTCHours(7, 0, 0, 0);
        return { start, end, source: 'intraday' as const };
      case '1M':
        start.setMonth(start.getMonth() - 1);
        break;
      case '6M':
        start.setMonth(start.getMonth() - 6);
        break;
      case '1Y':
        start.setFullYear(start.getFullYear() - 1);
        break;
      case '3Y':
        start.setFullYear(start.getFullYear() - 3);
        break;
      case 'ALL':
        break;
    }

    start.setHours(0, 0, 0, 0);
    return { start, end, source: 'daily' as const };
  }

  private toIntradayChartDate(date: Date) {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  }

  private async getPortfolioPriceHistory(
    symbols: string[],
    start: Date,
    end: Date,
    source: 'intraday' | 'daily',
  ) {
    const entries = await Promise.all(
      symbols.map(async (symbol) => {
        if (source === 'intraday') {
          const [points, previousPoint] = await Promise.all([
            this.prisma.priceIntraday.findMany({
              where: {
                symbol,
                time: {
                  gte: start,
                  lte: end,
                },
              },
              orderBy: {
                time: 'asc',
              },
              select: {
                time: true,
                price: true,
              },
            }),
            this.prisma.priceIntraday.findFirst({
              where: {
                symbol,
                time: {
                  lt: start,
                },
              },
              orderBy: {
                time: 'desc',
              },
              select: {
                price: true,
              },
            }),
          ]);

          return [
            symbol,
            {
              points: points.map((point) => ({
                time: Math.floor(point.time.getTime() / 1000),
                price: this.toNumber(point.price),
              })),
              previousPrice: previousPoint?.price
                ? this.toNumber(previousPoint.price)
                : null,
            } satisfies PortfolioPriceHistory,
          ] as const;
        }

        const [points, previousPoint] = await Promise.all([
          this.prisma.priceDaily.findMany({
            where: {
              symbol,
              date: {
                gte: start,
                lte: end,
              },
            },
            orderBy: {
              date: 'asc',
            },
            select: {
              date: true,
              price: true,
            },
          }),
          this.prisma.priceDaily.findFirst({
            where: {
              symbol,
              date: {
                lt: start,
              },
            },
            orderBy: {
              date: 'desc',
            },
            select: {
              price: true,
            },
          }),
        ]);

        return [
          symbol,
          {
            points: points.map((point) => ({
              time: Math.floor(point.date.getTime() / 1000),
              price: this.toNumber(point.price),
            })),
            previousPrice: previousPoint?.price
              ? this.toNumber(previousPoint.price)
              : null,
          } satisfies PortfolioPriceHistory,
        ] as const;
      }),
    );

    return new Map<string, PortfolioPriceHistory>(entries);
  }

  private async getLivePricesBySymbol(symbols: string[]) {
    const entries = await Promise.all(
      symbols.map(async (symbol) => {
        const price = await this.getCachedLivePrice(symbol);
        return [symbol, price] as const;
      }),
    );

    return new Map<string, number | null>(entries);
  }

  private async getPreviousClosesBySymbol(symbols: string[]) {
    const entries = await Promise.all(
      symbols.map(async (symbol) => {
        const previousClose = await this.getPreviousClose(symbol);
        return [symbol, previousClose] as const;
      }),
    );

    return new Map<string, number | null>(entries);
  }

  private deriveInitialCash(
    currentCash: number,
    transactions: PortfolioChartTransaction[],
  ) {
    return transactions.reduce((cash, transaction) => {
      if (transaction.type === 'BUY') {
        return cash + transaction.total;
      }

      return cash - transaction.total;
    }, currentCash);
  }

  private applyCashDelta(
    cash: number,
    transaction: Pick<PortfolioChartTransaction, 'type' | 'total'>,
  ) {
    return transaction.type === 'BUY'
      ? cash - transaction.total
      : cash + transaction.total;
  }

  private applyTransactionToPortfolioState(
    quantities: Map<string, number>,
    latestKnownPrices: Map<string, number>,
    transaction: Pick<
      PortfolioChartTransaction,
      'symbol' | 'type' | 'quantity' | 'price'
    >,
    options: { updatePrice?: boolean } = {},
  ) {
    const currentQuantity = quantities.get(transaction.symbol) ?? 0;
    const nextQuantity =
      transaction.type === 'BUY'
        ? currentQuantity + transaction.quantity
        : Math.max(currentQuantity - transaction.quantity, 0);

    if (nextQuantity > 0) {
      quantities.set(transaction.symbol, nextQuantity);
    } else {
      quantities.delete(transaction.symbol);
    }

    if (options.updatePrice !== false && transaction.price > 0) {
      latestKnownPrices.set(transaction.symbol, transaction.price);
    }
  }

  private calculatePortfolioValue(
    cash: number,
    quantities: Map<string, number>,
    latestKnownPrices: Map<string, number>,
  ) {
    let holdingsValue = 0;

    for (const [symbol, quantity] of quantities.entries()) {
      const latestPrice = latestKnownPrices.get(symbol);
      if (typeof latestPrice !== 'number' || latestPrice <= 0) continue;

      holdingsValue += quantity * latestPrice;
    }

    return cash + holdingsValue;
  }

  private async getTradePrice(symbol: string) {
    const cachedPrice = await this.getCachedLivePrice(symbol);
    if (cachedPrice) return cachedPrice;

    await this.redisService.requestImmediateLivePrice(symbol);

    for (let attempt = 0; attempt < 10; attempt += 1) {
      await this.wait(250);
      const workerPrice = await this.getCachedLivePrice(symbol);
      if (workerPrice) return workerPrice;
    }

    throw new BadRequestException(
      `No live price available for ${symbol}. Make sure the worker is running.`,
    );
  }

  private async getDisplayPrice(symbol: string) {
    const cachedPrice = await this.getCachedLivePrice(symbol);
    if (cachedPrice) return cachedPrice;

    const intradayPrice = await this.prisma.priceIntraday.findFirst({
      where: { symbol },
      orderBy: { time: 'desc' },
      select: { price: true },
    });

    if (intradayPrice) return this.toNumber(intradayPrice.price);

    const dailyPrice = await this.prisma.priceDaily.findFirst({
      where: { symbol },
      orderBy: { date: 'desc' },
      select: { price: true },
    });

    if (dailyPrice) return this.toNumber(dailyPrice.price);

    return this.getTradePrice(symbol);
  }

  private async getPreviousClose(symbol: string) {
    const cachedPrice = await this.redisService.getJson<LivePriceEvent>(
      `stocklatest:${symbol}`,
    );

    if (
      typeof cachedPrice?.previousClose === 'number' &&
      cachedPrice.previousClose > 0
    ) {
      return cachedPrice.previousClose;
    }

    const meta = await this.prisma.stockMeta.findUnique({
      where: { symbol },
      select: { previousClose: true },
    });

    return meta?.previousClose ? this.toNumber(meta.previousClose) : null;
  }

  private async getCachedLivePrice(symbol: string) {
    const cachedPrice = await this.redisService.getJson<LivePriceEvent>(
      `stocklatest:${symbol}`,
    );

    if (typeof cachedPrice?.price === 'number' && cachedPrice.price > 0) {
      return cachedPrice.price;
    }

    return null;
  }

  private wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private toDecimal(value: number) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }

    return new Prisma.Decimal(value);
  }

  private toNumber(value: Prisma.Decimal) {
    return value.toNumber();
  }

  private mapTradeResult(
    cash: Prisma.Decimal,
    holding: {
      id: string;
      symbol: string;
      quantity: Prisma.Decimal;
      averagePrice: Prisma.Decimal;
    },
    transaction: {
      id: string;
      type: 'BUY' | 'SELL';
      quantity: Prisma.Decimal;
      price: Prisma.Decimal;
      total: Prisma.Decimal;
      createdAt: Date;
    },
  ) {
    return {
      cash: this.toNumber(cash),
      holding: {
        id: holding.id,
        symbol: holding.symbol,
        quantity: this.toNumber(holding.quantity),
        averagePrice: this.toNumber(holding.averagePrice),
      },
      transaction: {
        id: transaction.id,
        type: transaction.type,
        quantity: this.toNumber(transaction.quantity),
        price: this.toNumber(transaction.price),
        total: this.toNumber(transaction.total),
        createdAt: transaction.createdAt,
      },
    };
  }
}
