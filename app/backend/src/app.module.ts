import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  providers: [PrismaService],
  controllers: [],
})
export class AppModule {}
