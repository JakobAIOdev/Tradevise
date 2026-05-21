import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateGroupDto } from './dto/create-group.dto.js';
import { JoinGroupDto } from './dto/join-group.dto.js';
import { PortfolioService } from '../portfolio/portfolio.service.js';

@Injectable()
export class GroupsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly portfolioService: PortfolioService,
  ) {}

  async createGroup(userId: string, dto: CreateGroupDto) {
    const code = await this.generateUniqueCode();
    const portfolio = await this.portfolioService.getActivePortfolioForUser(
      userId,
    );

    return this.prisma.group.create({
      data: {
        name: dto.name.trim(),
        code,
        ownerId: userId,
        members: {
          create: {
            userId,
            portfolioId: portfolio.id,
            role: 'OWNER',
          },
        },
      },
      select: {
        id: true,
        name: true,
        code: true,
        createdAt: true,
      },
    });
  }

  async joinGroup(userId: string, dto: JoinGroupDto) {
    const code = dto.code.trim().toUpperCase();
    const portfolio = await this.portfolioService.getActivePortfolioForUser(
      userId,
    );
    const group = await this.prisma.group.findUnique({
      where: { code },
      select: { id: true, name: true, code: true },
    });

    if (!group) {
      throw new NotFoundException('Group code not found');
    }

    const existingMembership = await this.prisma.groupMember.findUnique({
      where: {
        groupId_portfolioId: {
          groupId: group.id,
          portfolioId: portfolio.id,
        },
      },
    });

    if (existingMembership) {
      throw new BadRequestException('This portfolio is already a member of this group');
    }

    await this.prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId,
        portfolioId: portfolio.id,
      },
    });

    return group;
  }

  async getMyGroups(userId: string) {
    const portfolio = await this.portfolioService.getActivePortfolioForUser(
      userId,
    );

    return this.prisma.group.findMany({
      where: {
        members: {
          some: { portfolioId: portfolio.id },
        },
      },
      select: {
        id: true,
        name: true,
        code: true,
        ownerId: true,
        createdAt: true,
        _count: {
          select: { members: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getGroup(userId: string, groupId: string) {
    await this.ensureMember(userId, groupId);
    return this.prisma.group.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        name: true,
        code: true,
        ownerId: true,
        createdAt: true,
        members: {
          select: {
            role: true,
            joinedAt: true,
            user: {
              select: {
                id: true,
                username: true,
              },
            },
            portfolio: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
      },
    });
  }

  async getGroupLeaderboard(userId: string, groupId: string, metric = 'total') {
    await this.ensureMember(userId, groupId);

    const members = await this.prisma.groupMember.findMany({
      where: { groupId },
      select: { portfolioId: true, joinedAt: true },
    });

    return this.portfolioService.getLeaderboardForPortfoliosSince(
      userId,
      members.map((member) => ({
        portfolioId: member.portfolioId,
        baselineDate: member.joinedAt,
      })),
      metric,
    );
  }

  private async ensureMember(userId: string, groupId: string) {
    const portfolio = await this.portfolioService.getActivePortfolioForUser(
      userId,
    );
    const membership = await this.prisma.groupMember.findUnique({
      where: {
        groupId_portfolioId: {
          groupId,
          portfolioId: portfolio.id,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('This portfolio is not a member of this group');
    }

    return membership;
  }

  private async generateUniqueCode() {
    while (true) {
      const code = this.generateCode();

      const existing = await this.prisma.group.findUnique({
        where: { code },
        select: { id: true },
      });

      if (!existing) {
        return code;
      }
    }
  }

  private generateCode() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';

    for (let i = 0; i < 6; i++) {
      code += alphabet[Math.floor(Math.random() * alphabet.length)];
    }

    return code;
  }
}
