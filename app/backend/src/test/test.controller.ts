import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { AccessTokenGuard } from '../auth/guards/access-token.guard.js';

@Controller('test')
export class TestController {
  @Get('/')
  @UseGuards(AccessTokenGuard)
  user(@CurrentUser('username') username: string) {
    return { username };
  }
}
