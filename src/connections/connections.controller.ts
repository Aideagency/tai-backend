// src/modules/connections/connections.controller.ts
import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Req,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ConnectionsService } from './connections.service';
import { FollowListQueryDto } from './dtos/follow-list-query.dto';
import { JwtGuards } from 'src/auth/jwt.guards';

@ApiTags('connections')
@Controller('connections')
@UseGuards(JwtGuards)
@ApiBearerAuth()
export class ConnectionsController {
  constructor(private readonly connections: ConnectionsService) {}

  @ApiOperation({
    summary: 'Follow a user',
    description:
      'Creates (or restores) a follow edge from :meId → :targetUserId. Idempotent if already following.',
  })
  @ApiParam({
    name: 'targetUserId',
    description: 'Followee user ID',
    example: '456',
  })
  @ApiResponse({
    status: 201,
    description: 'Followed successfully (or restored).',
  })
  @Post('follow/:targetUserId')
  async follow(
    @Request() req: any,
    @Param('targetUserId') targetUserId: string,
  ) {
    return this.connections.follow(req.user.id, targetUserId);
  }

  @ApiOperation({
    summary: 'Unfollow a user',
    description:
      'Soft-unfollows (recommended) or deletes the follow edge from :meId → :targetUserId. Idempotent.',
  })
  @ApiParam({
    name: 'targetUserId',
    description: 'Followee user ID',
    example: '456',
  })
  @ApiResponse({ status: 204, description: 'Unfollowed (no content).' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('follow/:targetUserId')
  async unfollow(
    @Request() req: any,
    @Param('targetUserId') targetUserId: string,
  ) {
    await this.connections.unfollow(req.user.id, targetUserId);
  }


  @ApiOperation({
    summary: 'Check if I am following :targetUserId',
  })
  @ApiParam({ name: 'targetUserId', description: 'Potential followee ID' })
  @Get('is-following/:targetUserId')
  async isFollowing(
    @Request() req: any,
    @Param('targetUserId') targetUserId: string,
  ) {
    const following = await this.connections.isFollowing(
      req.user.id,
      targetUserId,
    );
    return { following };
  }

  @ApiOperation({ summary: 'Get counts for a user' })
  @Get('counts')
  async counts(@Request() req: any) {
    return this.connections.counts(req.user.id);
  }

  @ApiOperation({
    summary: 'List followers of a user',
    description:
      'Returns users who follow :userId. Supports pagination, sorting, and optional quick search.',
  })
  @Get('followers')
  async listFollowers(@Request() req: any, @Query() query: FollowListQueryDto) {
    const params = {
      ...query,
      includePending: true,
      includeDeleted: true,
    };
    return this.connections.listFollowers(req.user.id, params);
  }

  @ApiOperation({
    summary: 'List following of a user',
    description:
      'Returns users that :userId is following. Supports pagination, sorting, and optional quick search.',
  })
  @Get('following')
  async listFollowing(@Request() req: any, @Query() query: FollowListQueryDto) {
    const params = {
      ...query,
      includePending: true,
      includeDeleted: true,
    };
    return this.connections.listFollowing(req.user.id, params);
  }

  // -----------------------------
  // Private-account requests
  // -----------------------------

  @ApiOperation({
    summary: 'Accept a pending follow request',
    description:
      'Accepts a PENDING follow request from :followerId → :meId (useful for private accounts).',
  })
  @ApiParam({
    name: 'meId',
    description: 'The private account owner (followee)',
  })
  @ApiParam({ name: 'followerId', description: 'The requester (follower)' })
  @Post(':meId/requests/:followerId/accept')
  async acceptFollowRequest(
    @Param('meId') meId: string,
    @Param('followerId') followerId: string,
  ) {
    return this.connections.acceptFollowRequest(followerId, meId);
  }

  @ApiOperation({
    summary: 'Decline a pending follow request',
  })
  @ApiParam({
    name: 'meId',
    description: 'The private account owner (followee)',
  })
  @ApiParam({ name: 'followerId', description: 'The requester (follower)' })
  @Post(':meId/requests/:followerId/decline')
  async declineFollowRequest(
    @Param('meId') meId: string,
    @Param('followerId') followerId: string,
  ) {
    return this.connections.declineFollowRequest(followerId, meId);
  }

  // -----------------------------
  // (Optional) Raw edge fetch
  // -----------------------------

  @ApiOperation({
    summary: 'Get a specific follow edge',
    description:
      'Fetches the raw follow edge and joined users for (:aId → :bId).',
  })
  @ApiParam({ name: 'aId', description: 'Follower ID' })
  @ApiParam({ name: 'bId', description: 'Followee ID' })
  @Get('edge/:aId/:bId')
  async getEdge(@Param('aId') aId: string, @Param('bId') bId: string) {
    return this.connections.getEdge(aId, bId);
  }
}
