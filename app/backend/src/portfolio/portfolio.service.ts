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
      holdings: enrichedHoldings.map(({ todayBaselineValue, ...holding }) => holding),
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

    const weeklyPrice = await this.prisma.priceWeekly.findFirst({
      where: { symbol },
      orderBy: { date: 'desc' },
      select: { price: true },
    });

    if (weeklyPrice) return this.toNumber(weeklyPrice.price);

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
