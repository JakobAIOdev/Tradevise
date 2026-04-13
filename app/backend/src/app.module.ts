import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module.js';
import { TestController } from './test/test.controller.js';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.register({}),
    AuthModule,
    PrismaModule,
  ],
  controllers: [TestController],
})
export class AppModule {}
