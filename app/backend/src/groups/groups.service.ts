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
    return this.prisma.group.create({
      data: {
        name: dto.name.trim(),
        code,
        ownerId: userId,
        members: {
          create: {
            userId,
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
    const group = await this.prisma.group.findUnique({
      where: { code },
      select: { id: true, name: true, code: true },
    });

    if (!group) {
      throw new NotFoundException('Group code not found');
    }

    const existingMembership = await this.prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: group.id,
          userId,
        },
      },
    });

    if (existingMembership) {
      throw new BadRequestException('You are already a member of this group');
    }

    await this.prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId,
      },
    });

    return group;
  }

  async getMyGroups(userId: string) {
    return this.prisma.group.findMany({
      where: {
        members: {
          some: { userId },
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
      select: { userId: true, joinedAt: true },
    });

    return this.portfolioService.getLeaderboardForUsersSince(
      userId,
      members.map((member) => ({
        userId: member.userId,
        baselineDate: member.joinedAt,
      })),
      metric,
    );
  }

  private async ensureMember(userId: string, groupId: string) {
    const membership = await this.prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this group');
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
