import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { AccessTokenGuard } from '../auth/guards/access-token.guard.js';
import { StocksService } from './stocks.service.js';

@Controller('stocks')
@UseGuards(AccessTokenGuard)
export class StocksController {
  constructor(private stocksService: StocksService) {}

  @Get('search')
  search(@Query('q') query = '') {
    return this.stocksService.search(query);
  }

  @Get('discover')
  discover() {
    return this.stocksService.getDiscoverStocks();
  }

  @Get('watchlist')
  watchlist(@CurrentUser('sub') userId: string) {
    return this.stocksService.getWatchlistStocks(userId);
  }

  @Post('watchlist/:ticker')
  addToWatchlist(
    @CurrentUser('sub') userId: string,
    @Param('ticker') ticker: string,
  ) {
    return this.stocksService.addToWatchlist(userId, ticker);
  }

  @Delete('watchlist/:ticker')
  removeFromWatchlist(
    @CurrentUser('sub') userId: string,
    @Param('ticker') ticker: string,
  ) {
    return this.stocksService.removeFromWatchlist(userId, ticker);
  }

  @Sse('live')
  liveMany(@Query('symbols') symbols = '') {
    return this.stocksService.streamLivePrices(symbols.split(','));
  }

  @Get(':ticker/chart')
  chart(@Param('ticker') ticker: string, @Query('range') range = 'intraday') {
    return this.stocksService.getChartHistory(ticker, range);
  }

  @Get(':ticker/statistics')
  statistics(@Param('ticker') ticker: string) {
    return this.stocksService.getStatistics(ticker);
  }

  @Sse(':ticker/live')
  live(@Param('ticker') ticker: string) {
    return this.stocksService.streamLivePrice(ticker);
  }
}
