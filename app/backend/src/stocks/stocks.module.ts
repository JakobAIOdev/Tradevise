import { Module } from '@nestjs/common';
import { StocksController } from './stocks.controller.js';
import { StocksService } from './stocks.service.js';

@Module({
  controllers: [StocksController],
  providers: [StocksService],
})
export class StocksModule {}
