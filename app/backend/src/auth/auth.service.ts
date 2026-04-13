import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from './dto/login.dto.js';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { User } from '@prisma/client';
import { ACCESS_TOKEN_TTL, REFRESH_TOKEN_TTL } from './auth.constants.js';

type AuthUser = Pick<
  User,
  | 'id'
  | 'email'
  | 'username'
  | 'passwordHash'
  | 'hashedRefreshToken'
  | 'tokenVersion'
>;

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prismaService: PrismaService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prismaService.user.findFirst({
      where: { OR: [{ email: dto.email }, { username: dto.username }] },
    });

    if (existing)
      throw new ConflictException('Email or Username already in use.');

    const passwordHash = await argon2.hash(dto.password);
    const user: AuthUser = await this.prismaService.user.create({
      data: { email: dto.email, username: dto.username, passwordHash },
    });

    const tokens = await this.generateTokens(user);
    await this.storeRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async login(dto: LoginDto) {
    const user: AuthUser | null = await this.prismaService.user.findFirst({
      where: { username: dto.username },
    });

    if (!user) throw new UnauthorizedException('Invalid login data');

    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) throw new UnauthorizedException('Invalid login data');

    const currentTokenVersion = this.getTokenVersion(user.tokenVersion);
    const nextTokenVersion = currentTokenVersion + 1;
    const tokens = await this.generateTokens(user, nextTokenVersion);
    await this.storeRefreshToken(
      user.id,
      tokens.refreshToken,
      nextTokenVersion,
    );
    return tokens;
  }

  async refresh(userId: string, rawRefreshToken: string, tokenVersion: number) {
    const user: AuthUser | null = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user?.hashedRefreshToken || user.tokenVersion !== tokenVersion)
      throw new ForbiddenException('Access denied');

    const tokenMatch = await argon2.verify(
      user.hashedRefreshToken,
      rawRefreshToken,
    );

    if (!tokenMatch) throw new ForbiddenException('Access denied');

    const currentTokenVersion = this.getTokenVersion(user.tokenVersion);
    const nextTokenVersion = currentTokenVersion + 1;
    const tokens = await this.generateTokens(user, nextTokenVersion);
    const updated = await this.storeRefreshToken(
      user.id,
      tokens.refreshToken,
      nextTokenVersion,
      tokenVersion,
    );

    if (!updated) throw new ForbiddenException('Access denied');
    return tokens;
  }

  async logout(userId: string, tokenVersion: number) {
    await this.prismaService.user.updateMany({
      where: { id: userId, tokenVersion },
      data: {
        hashedRefreshToken: null,
        tokenVersion: { increment: 1 },
      },
    });
    return { message: 'Successfully logged out' };
  }

  private async generateTokens(
    {
      id,
      username,
      email,
      tokenVersion,
    }: Pick<User, 'id' | 'username' | 'email' | 'tokenVersion'>,
    version = tokenVersion,
  ) {
    const access_secret = this.configService.get<string>('JWT_ACCESS_SECRET');
    const refresh_secret = this.configService.get<string>('JWT_REFRESH_SECRET');

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: id, username, email, tokenVersion: version },
        {
          secret: access_secret,
          expiresIn: ACCESS_TOKEN_TTL,
        },
      ),
      this.jwtService.signAsync(
        { sub: id, tokenVersion: version },
        {
          secret: refresh_secret,
          expiresIn: REFRESH_TOKEN_TTL,
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(
    userId: string,
    rawToken: string,
    nextTokenVersion?: number,
    currentTokenVersion?: number,
  ) {
    const hashed = await argon2.hash(rawToken);

    const result = await this.prismaService.user.updateMany({
      where: {
        id: userId,
        ...(typeof currentTokenVersion === 'number'
          ? { tokenVersion: currentTokenVersion }
          : {}),
      },
      data: {
        hashedRefreshToken: hashed,
        ...(typeof nextTokenVersion === 'number'
          ? { tokenVersion: nextTokenVersion }
          : {}),
      },
    });

    return result.count === 1;
  }

  private getTokenVersion(tokenVersion: unknown): number {
    if (typeof tokenVersion !== 'number') {
      throw new UnauthorizedException('Invalid token version');
    }

    return tokenVersion;
  }
}
