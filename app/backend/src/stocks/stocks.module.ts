import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PortfolioModule } from '../portfolio/portfolio.module.js';
import { StocksController } from './stocks.controller.js';
import { StocksService } from './stocks.service.js';

@Module({
  imports: [AuthModule, PortfolioModule],
  controllers: [StocksController],
  providers: [StocksService],
})
export class StocksModule {}
