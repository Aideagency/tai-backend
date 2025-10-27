// src/modules/connections/connections.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import {
  FollowRepository,
  FollowListParams,
} from 'src/repository/connection/follow.repository';

@Injectable()
export class ConnectionsService {
  constructor(private readonly follows: FollowRepository) {}

  /** Create (or restore) a follow edge: me -> target */
  async follow(meId: number | string, targetUserId: number | string) {
    if (String(meId) === String(targetUserId)) {
      throw new BadRequestException('You cannot follow yourself.');
    }
    return this.follows.follow(meId, targetUserId);
  }

  /** Unfollow: me -> target (soft-unfollow if supported) */
  async unfollow(meId: number | string, targetUserId: number | string) {
    if (String(meId) === String(targetUserId)) return;
    return this.follows.unfollow(meId, targetUserId);
  }

  /** Is me following target? */
  async isFollowing(meId: number | string, targetUserId: number | string) {
    if (String(meId) === String(targetUserId)) return false;
    return this.follows.isFollowing(meId, targetUserId);
  }

  /** Followers of user (who follows THIS user) */
  async listFollowers(userId: number | string, params: FollowListParams = {}) {
    return this.follows.listFollowers(userId, params);
  }

  /** Who THIS user follows (following) */
  async listFollowing(userId: number | string, params: FollowListParams = {}) {
    return this.follows.listFollowing(userId, params);
  }

  /** Quick counters */
  async counts(userId: number | string) {
    const [followers, following] = await Promise.all([
      this.follows.countFollowers(userId),
      this.follows.countFollowing(userId),
    ]);
    return { followers, following };
  }

  /** For private accounts: accept a pending follow request (follower -> me) */
  async acceptFollowRequest(
    followerId: number | string,
    meId: number | string,
  ) {
    return this.follows.accept(followerId, meId);
  }

  /** For private accounts: decline a pending follow request (follower -> me) */
  async declineFollowRequest(
    followerId: number | string,
    meId: number | string,
  ) {
    return this.follows.decline(followerId, meId);
  }

  /** (Optional) Fetch raw edge with joined users */
  async getEdge(meId: number | string, otherUserId: number | string) {
    return this.follows.getEdge(meId, otherUserId);
  }
}
