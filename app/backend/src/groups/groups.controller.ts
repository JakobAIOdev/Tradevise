import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GroupsService } from './groups.service.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { CreateGroupDto } from './dto/create-group.dto.js';
import { JoinGroupDto } from './dto/join-group.dto.js';
import { AccessTokenGuard } from '../auth/guards/access-token.guard.js';

@ApiTags('Groups')
@ApiBearerAuth('access-token')
@Controller('groups')
@UseGuards(AccessTokenGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a private group' })
  createGroup(@CurrentUser('sub') userId: string, @Body() dto: CreateGroupDto) {
    return this.groupsService.createGroup(userId, dto);
  }

  @Post('join')
  @ApiOperation({ summary: 'Join a private group by invite code' })
  joinGroup(@CurrentUser('sub') userId: string, @Body() dto: JoinGroupDto) {
    return this.groupsService.joinGroup(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List groups for the current user' })
  getMyGroups(@CurrentUser('sub') userId: string) {
    return this.groupsService.getMyGroups(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one group' })
  getGroup(@CurrentUser('sub') userId: string, @Param('id') groupId: string) {
    return this.groupsService.getGroup(userId, groupId);
  }

  @Get(':id/leaderboard')
  @ApiOperation({ summary: 'Get a group leaderboard' })
  getGroupLeaderboard(
    @CurrentUser('sub') userId: string,
    @Param('id') groupId: string,
    @Query('metric') metric = 'total',
  ) {
    return this.groupsService.getGroupLeaderboard(userId, groupId, metric);
  }
}
