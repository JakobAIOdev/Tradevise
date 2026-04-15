import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { BuyStockDto } from './dto/buy-stock.dto.js';
import { SellStockDto } from './dto/sell-stock.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';

type LivePriceEvent = {
  symbol: string;
  price?: number;
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

    const enrichedHoldings = await Promise.all(
      holdings.map(async (holding) => {
        const currentPrice = await this.getDisplayPrice(holding.symbol);
        const quantity = this.toNumber(holding.quantity);
        const averagePrice = this.toNumber(holding.averagePrice);

        return {
          id: holding.id,
          symbol: holding.symbol,
          quantity,
          averagePrice,
          currentPrice,
          marketValue: quantity * currentPrice,
          profitLoss: quantity * (currentPrice - averagePrice),
        };
      }),
    );

    const holdingsValue = enrichedHoldings.reduce(
      (sum, holding) => sum + holding.marketValue,
      0,
    );
    const cash = this.toNumber(portfolio.cash);

    return {
      userId,
      cash,
      holdingsValue,
      totalValue: cash + holdingsValue,
      holdings: enrichedHoldings,
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
