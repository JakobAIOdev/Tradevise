import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { StocksController } from './stocks.controller.js';
import { StocksService } from './stocks.service.js';

@Module({
  imports: [AuthModule],
  controllers: [StocksController],
  providers: [StocksService],
})
export class StocksModule {}
