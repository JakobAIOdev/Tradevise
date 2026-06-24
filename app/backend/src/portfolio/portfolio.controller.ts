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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { AccessTokenGuard } from '../auth/guards/access-token.guard.js';
import { BuyStockDto } from './dto/buy-stock.dto.js';
import { CreatePortfolioDto } from './dto/create-portfolio.dto.js';
import { SellStockDto } from './dto/sell-stock.dto.js';
import { SetActivePortfolioDto } from './dto/set-active-portfolio.dto.js';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto.js';
import { PortfolioService } from './portfolio.service.js';

@ApiTags('Portfolios')
@ApiBearerAuth('access-token')
@Controller('portfolios')
@UseGuards(AccessTokenGuard)
export class PortfoliosController {
  constructor(private portfolioService: PortfolioService) {}

  @Get()
  @ApiOperation({ summary: 'List portfolios for the current user' })
  listPortfolios(@CurrentUser('sub') userId: string) {
    return this.portfolioService.listPortfolios(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a portfolio' })
  createPortfolio(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreatePortfolioDto,
  ) {
    return this.portfolioService.createPortfolio(userId, dto);
  }

  @Patch('active')
  @ApiOperation({ summary: 'Set the active portfolio' })
  setActivePortfolio(
    @CurrentUser('sub') userId: string,
    @Body() dto: SetActivePortfolioDto,
  ) {
    return this.portfolioService.setActivePortfolio(userId, dto.portfolioId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Rename a portfolio' })
  updatePortfolio(
    @CurrentUser('sub') userId: string,
    @Param('id') portfolioId: string,
    @Body() dto: UpdatePortfolioDto,
  ) {
    return this.portfolioService.updatePortfolio(userId, portfolioId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a portfolio' })
  deletePortfolio(
    @CurrentUser('sub') userId: string,
    @Param('id') portfolioId: string,
  ) {
    return this.portfolioService.deletePortfolio(userId, portfolioId);
  }
}

@ApiTags('Portfolio')
@ApiBearerAuth('access-token')
@Controller('portfolio')
@UseGuards(AccessTokenGuard)
export class PortfolioController {
  constructor(private portfolioService: PortfolioService) {}

  @Get()
  @ApiOperation({ summary: 'Get the active portfolio overview' })
  getPortfolio(@CurrentUser('sub') userId: string) {
    return this.portfolioService.getPortfolio(userId);
  }

  @Get('chart')
  @ApiOperation({
    summary: 'Get performance chart data for the active portfolio',
  })
  getChart(
    @CurrentUser('sub') userId: string,
    @Query('range') range = 'intraday',
  ) {
    return this.portfolioService.getPortfolioChart(userId, range);
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get the global portfolio leaderboard' })
  getLeaderboard(
    @CurrentUser('sub') userId: string,
    @Query('metric') metric = 'total',
  ) {
    return this.portfolioService.getLeaderboard(userId, metric);
  }

  @Post('buy')
  @ApiOperation({ summary: 'Place a simulated buy order' })
  buyStock(@CurrentUser('sub') userId: string, @Body() dto: BuyStockDto) {
    return this.portfolioService.buyStock(userId, dto);
  }

  @Post('sell')
  @ApiOperation({ summary: 'Place a simulated sell order' })
  sellStock(@CurrentUser('sub') userId: string, @Body() dto: SellStockDto) {
    return this.portfolioService.sellStock(userId, dto);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'List active portfolio transactions' })
  getTransactions(@CurrentUser('sub') userId: string) {
    return this.portfolioService.getTransactions(userId);
  }
}
