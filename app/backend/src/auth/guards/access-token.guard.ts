import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service.js';

export interface AccessJwtPayload {
  sub: string;
  email: string;
  username: string;
  tokenVersion: number;
  refreshToken?: string;
}

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prismaService: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractBearerToken(request);

    if (!token)
      throw new UnauthorizedException('No authorization bearer token provided');

    let payload: AccessJwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<AccessJwtPayload>(token, {
        secret: this.configService.get('JWT_ACCESS_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    const user = await this.prismaService.user.findUnique({
      where: { id: payload.sub },
      select: { tokenVersion: true },
    });

    if (!user || user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    request['user'] = payload;
    return true;
  }

  private extractBearerToken(request: Request): string | null {
    const authorizationHeader = request.get('authorization');
    if (!authorizationHeader) return null;

    const [type, token] = authorizationHeader.split(' ');

    return type === 'Bearer' ? token : null;
  }
}
