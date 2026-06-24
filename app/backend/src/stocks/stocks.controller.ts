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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { AccessTokenGuard } from '../auth/guards/access-token.guard.js';
import { StocksService } from './stocks.service.js';

@ApiTags('Stocks')
@ApiBearerAuth('access-token')
@Controller('stocks')
@UseGuards(AccessTokenGuard)
export class StocksController {
  constructor(private stocksService: StocksService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search stocks by query' })
  search(@Query('q') query = '') {
    return this.stocksService.search(query);
  }

  @Get('discover')
  @ApiOperation({ summary: 'Get curated discover stocks' })
  discover() {
    return this.stocksService.getDiscoverStocks();
  }

  @Get('watchlist')
  @ApiOperation({ summary: 'Get the current user watchlist' })
  watchlist(@CurrentUser('sub') userId: string) {
    return this.stocksService.getWatchlistStocks(userId);
  }

  @Post('watchlist/:ticker')
  @ApiOperation({ summary: 'Add a stock to the current user watchlist' })
  addToWatchlist(
    @CurrentUser('sub') userId: string,
    @Param('ticker') ticker: string,
  ) {
    return this.stocksService.addToWatchlist(userId, ticker);
  }

  @Delete('watchlist/:ticker')
  @ApiOperation({ summary: 'Remove a stock from the current user watchlist' })
  removeFromWatchlist(
    @CurrentUser('sub') userId: string,
    @Param('ticker') ticker: string,
  ) {
    return this.stocksService.removeFromWatchlist(userId, ticker);
  }

  @Sse('live')
  @ApiOperation({
    summary: 'Stream live prices for multiple symbols using SSE',
  })
  liveMany(@Query('symbols') symbols = '') {
    return this.stocksService.streamLivePrices(symbols.split(','));
  }

  @Get(':ticker/chart')
  @ApiOperation({ summary: 'Get chart history for a stock' })
  chart(@Param('ticker') ticker: string, @Query('range') range = 'intraday') {
    return this.stocksService.getChartHistory(ticker, range);
  }

  @Get(':ticker/statistics')
  @ApiOperation({ summary: 'Get statistics for a stock' })
  statistics(@Param('ticker') ticker: string) {
    return this.stocksService.getStatistics(ticker);
  }

  @Sse(':ticker/live')
  @ApiOperation({
    summary: 'Stream live price updates for one stock using SSE',
  })
  live(@Param('ticker') ticker: string) {
    return this.stocksService.streamLivePrice(ticker);
  }
}
