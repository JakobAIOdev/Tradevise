import { Module } from '@nestjs/common';
import { GroupsController } from './groups.controller.js';
import { GroupsService } from './groups.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { PortfolioModule } from '../portfolio/portfolio.module.js';

@Module({
  imports: [AuthModule, PrismaModule, PortfolioModule],
  providers: [GroupsService],
  controllers: [GroupsController],
})
export class GroupsModule {}
