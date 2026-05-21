import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { AccessTokenGuard } from '../auth/guards/access-token.guard.js';
import { BuyStockDto } from './dto/buy-stock.dto.js';
import { CreatePortfolioDto } from './dto/create-portfolio.dto.js';
import { SellStockDto } from './dto/sell-stock.dto.js';
import { SetActivePortfolioDto } from './dto/set-active-portfolio.dto.js';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto.js';
import { PortfolioService } from './portfolio.service.js';

@Controller('portfolios')
@UseGuards(AccessTokenGuard)
export class PortfoliosController {
  constructor(private portfolioService: PortfolioService) {}

  @Get()
  listPortfolios(@CurrentUser('sub') userId: string) {
    return this.portfolioService.listPortfolios(userId);
  }

  @Post()
  createPortfolio(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreatePortfolioDto,
  ) {
    return this.portfolioService.createPortfolio(userId, dto);
  }

  @Patch('active')
  setActivePortfolio(
    @CurrentUser('sub') userId: string,
    @Body() dto: SetActivePortfolioDto,
  ) {
    return this.portfolioService.setActivePortfolio(userId, dto.portfolioId);
  }

  @Patch(':id')
  updatePortfolio(
    @CurrentUser('sub') userId: string,
    @Param('id') portfolioId: string,
    @Body() dto: UpdatePortfolioDto,
  ) {
    return this.portfolioService.updatePortfolio(userId, portfolioId, dto);
  }

  @Delete(':id')
  deletePortfolio(
    @CurrentUser('sub') userId: string,
    @Param('id') portfolioId: string,
  ) {
    return this.portfolioService.deletePortfolio(userId, portfolioId);
  }
}

@Controller('portfolio')
@UseGuards(AccessTokenGuard)
export class PortfolioController {
  constructor(private portfolioService: PortfolioService) {}

  @Get()
  getPortfolio(@CurrentUser('sub') userId: string) {
    return this.portfolioService.getPortfolio(userId);
  }

  @Get('chart')
  getChart(
    @CurrentUser('sub') userId: string,
    @Query('range') range = 'intraday',
  ) {
    return this.portfolioService.getPortfolioChart(userId, range);
  }

  @Get('leaderboard')
  getLeaderboard(
    @CurrentUser('sub') userId: string,
    @Query('metric') metric = 'total',
  ) {
    return this.portfolioService.getLeaderboard(userId, metric);
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
