import { Controller, Get, Param, Query, Sse, UseGuards } from '@nestjs/common';
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
