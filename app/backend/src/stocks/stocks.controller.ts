import { Controller, Get, Param, Query, Sse, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from '../auth/guards/access-token.guard.js';
import { StocksService } from './stocks.service.js';

@Controller('stocks')
export class StocksController {
  constructor(private stocksService: StocksService) {}

  @Get('search')
  search(@Query('q') query = '') {
    return this.stocksService.search(query);
  }

  @Sse(':ticker/live')
  @UseGuards(AccessTokenGuard)
  live(@Param('ticker') ticker: string) {
    return this.stocksService.streamLivePrice(ticker);
  }
}
