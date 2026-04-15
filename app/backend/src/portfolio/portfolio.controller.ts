import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { AccessTokenGuard } from '../auth/guards/access-token.guard.js';
import { BuyStockDto } from '../dto/buy-stock.dto.js';
import { SellStockDto } from '../dto/sell-stock.dto.js';
import { PortfolioService } from './portfolio.service.js';

@Controller('portfolio')
@UseGuards(AccessTokenGuard)
export class PortfolioController {
  constructor(private portfolioService: PortfolioService) {}

  @Get()
  getPortfolio(@CurrentUser('sub') userId: string) {
    return this.portfolioService.getPortfolio(userId);
  }

  @Post('buy')
  buyStock(@CurrentUser('sub') userId: string, @Body() dto: BuyStockDto) {
    return this.portfolioService.buyStock(userId, dto);
  }

  @Post('sell')
  sellStock(@CurrentUser('sub') userId: string, @Body() dto: SellStockDto) {
    return this.portfolioService.sellStock(userId, dto);
  }

  @Get('transactions')
  getTransactions(@CurrentUser('sub') userId: string) {
    return this.portfolioService.getTransactions(userId);
  }
}
