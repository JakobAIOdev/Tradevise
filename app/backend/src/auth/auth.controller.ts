import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import type { Response } from 'express';
import { RefreshTokenGuard } from './guards/refresh-token.guard.js';
import { ConfigService } from '@nestjs/config';
import { REFRESH_COOKIE_MAX_AGE_MS } from './auth.constants.js';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiOkResponse({
    description: 'Returns an access token and sets the refresh token cookie.',
  })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.register(dto);
    this.setRefreshToken(response, refreshToken);

    return { access_token: accessToken };
  }

  @Post('login')
  @ApiOperation({ summary: 'Log in an existing user' })
  @ApiOkResponse({
    description: 'Returns an access token and sets the refresh token cookie.',
  })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.login(dto);
    this.setRefreshToken(response, refreshToken);

    return { access_token: accessToken };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RefreshTokenGuard)
  @ApiCookieAuth('refresh-token')
  @ApiOperation({ summary: 'Refresh the access token' })
  @ApiOkResponse({
    description:
      'Rotates the refresh token cookie and returns a new access token.',
  })
  async refresh(
    @CurrentUser('sub') userId: string,
    @CurrentUser('tokenVersion') tokenVersion: number,
    @CurrentUser('refreshToken') refreshToken: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.refresh(
      userId,
      refreshToken,
      tokenVersion,
    );
    this.setRefreshToken(response, result.refreshToken);

    return { access_token: result.accessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RefreshTokenGuard)
  @ApiCookieAuth('refresh-token')
  @ApiOperation({ summary: 'Log out the current user' })
  @ApiOkResponse({
    description:
      'Clears the refresh token cookie and invalidates the token version.',
  })
  logout(
    @CurrentUser('sub') userId: string,
    @CurrentUser('tokenVersion') tokenVersion: number,
    @Res({ passthrough: true }) response: Response,
  ) {
    this.clearRefreshToken(response);
    return this.authService.logout(userId, tokenVersion);
  }

  private getRefreshCookiePath() {
    return this.configService.get<string>('REFRESH_COOKIE_PATH') ?? '/auth';
  }

  private setRefreshToken(response: Response, refreshToken: string) {
    response.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: this.getRefreshCookiePath(),
      maxAge: REFRESH_COOKIE_MAX_AGE_MS,
    });
  }

  private clearRefreshToken(response: Response) {
    response.clearCookie('refresh_token', {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: this.getRefreshCookiePath(),
    });
  }
}
