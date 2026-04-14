import { Controller, Get, Query } from '@nestjs/common';
import { StocksService } from './stocks.service.js';

@Controller('stocks')
export class StocksController {
  constructor(private stocksService: StocksService) {}

  @Get('search')
  search(@Query('q') query = '') {
    return this.stocksService.search(query);
  }
}
