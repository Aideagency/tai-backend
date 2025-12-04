// src/modules/connections/connections.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { PrayerWallService } from 'src/prayer-wall/prayer-wall.service';
import {
  FollowRepository,
  FollowListParams,
} from 'src/repository/connection/follow.repository';
import { PrayerWallRepository } from 'src/repository/prayer/prayer-wall.repository';
import {
  UserRepository,
  UserSearchParams,
} from 'src/repository/user/user.repository';

@Injectable()
export class ConnectionsService {
  constructor(
    private readonly follows: FollowRepository,
    private readonly userRepo: UserRepository,
    private readonly prayerRepo: PrayerWallRepository,
    private readonly authService: AuthService,
  ) {}

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

  // async getConnectionDetails(
  //   currentUserId: number | string,
  //   otherUserId: number | string,
  // ) {
  //   // Query to check if the current user is following the other user
  //   const isFollowing = await this.repository
  //     .createQueryBuilder('f')
  //     .where('f.follower.id = :currentUserId', { currentUserId })
  //     .andWhere('f.followee.id = :otherUserId', { otherUserId })
  //     .andWhere('f.status = :status', { status: FollowStatus.ACCEPTED }) // You can change this based on your follow status (e.g., ACCEPTED)
  //     .getCount();

  //   // If the user is following, `isFollowing` will be > 0
  //   const followingStatus = isFollowing > 0;

  //   // Now, let's fetch the `name` and `community` of the user (follower and followee)
  //   const user = await this.userRepo
  //     .createQueryBuilder('user')
  //     .select(['user.first_name', 'user.last_name', 'user.community'])
  //     .where('user.id = :userId', { userId: otherUserId })
  //     .getOne();

  //   if (!user) {
  //     throw new NotFoundException('User not found');
  //   }

  //   const connectionDetails = {
  //     name: `${user.first_name} ${user.last_name}`, // Concatenate first and last name
  //     community: user.community, // Assuming you have a 'community' field in the UserEntity
  //     isFollowing: followingStatus, // Whether the current user is following this user
  //   };

  //   return connectionDetails;
  // }

  async getUserConnectionDetailsAndPrayers({
    // followerId,
    followeeId,
    userId,
  }: {
    // followerId: number | string;
    followeeId: number | string;
    userId: string | number;
  }) {
    // Get the connection details between the follower and followee
    // const connectionDetails = await this.getConnectionDetails(
    //   followerId,
    //   followeeId,
    // );

    // Get the list of prayers by the user
    const user = await this.authService.getUserInformation(Number(followeeId));

    const userFeeds = await this.follows.getUserContentFeed(followeeId);

    // const edge = await this.follows.getEdge(userId, followeeId);

    // console.log('EDGE', edge);

    // Get the list of mutual friends
    const mutualFriends = await this.follows.getMutualFriends(
      userId,
      followeeId,
    );

    return {
      // connectionDetails,
      user,
      userFeeds,
      mutualFriends,
    };
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

  async listPendingFollowers(
    userId: number | string,
    params: FollowListParams = {},
  ) {
    return this.follows.listPendingFollowers(userId, params);
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

  async searchPaginated(params: UserSearchParams, id: number) {
    return this.userRepo.searchPaginated({ ...params, excludeId: id });
  }
}
