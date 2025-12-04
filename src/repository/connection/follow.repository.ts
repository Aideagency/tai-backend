// src/repository/follow/follow.repository.ts
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, QueryFailedError } from 'typeorm';
import { BaseRepository } from '../base.repository';
import {
  FollowEntity,
  FollowStatus,
} from 'src/database/entities/follow.entity';
import { UserEntity } from 'src/database/entities/user.entity';
import { PostEntity } from 'src/database/entities/post.entity';
import { PrayerWallEntity } from 'src/database/entities/prayer-wall.entity';

export interface FollowListParams {
  page?: number;
  pageSize?: number;
  orderBy?: 'created_at' | 'id';
  orderDir?: 'ASC' | 'DESC';
  includePending?: boolean; // include PENDING edges (for private accounts)
  includeDeleted?: boolean; // include soft-deleted edges
  q?: string; // optional text search on user fields
}

@Injectable()
export class FollowRepository extends BaseRepository<
  FollowEntity,
  Repository<FollowEntity>
> {
  protected logger = new Logger(FollowRepository.name);

  constructor(
    @InjectRepository(FollowEntity)
    repository: Repository<FollowEntity>,
    @InjectRepository(PostEntity)
    private readonly postRepo: Repository<PostEntity>,

    @InjectRepository(PrayerWallEntity)
    private readonly prayerRepo: Repository<PrayerWallEntity>,
  ) {
    super(repository);
  }

  /**
   * Create or restore a follow edge (A -> B).
   * Idempotent: following twice won't throw.
   */
  async follow(followerId: string | number, followeeId: string | number) {
    if (String(followerId) === String(followeeId)) {
      throw new BadRequestException('You cannot follow yourself.');
    }

    // Try to find existing edge (even if soft-deleted)
    let edge = await this.repository.findOne({
      where: {
        follower: { id: followerId as any },
        followee: { id: followeeId as any },
      },
      withDeleted: true, // if you use soft delete on entity; else use isDeleted flag
    });

    if (edge) {
      // If soft-deleted or marked deleted, restore it
      if ((edge as any).isDeleted === true) {
        (edge as any).isDeleted = false;
      }
      edge.status = FollowStatus.ACCEPTED; // or PENDING if your followee is private
      return this.repository.save(edge);
    }

    // Create new edge
    try {
      const created = this.repository.create({
        follower: { id: followerId } as UserEntity,
        followee: { id: followeeId } as UserEntity,
        status: FollowStatus.ACCEPTED, // or PENDING
      });
      return await this.repository.save(created);
    } catch (e) {
      // Handle unique constraint race
      if (e instanceof QueryFailedError) {
        this.logger.warn(
          `Unique violation on follow(${followerId} -> ${followeeId})`,
        );
        // Fetch and return existing to keep it idempotent
        const existing = await this.repository.findOne({
          where: {
            follower: { id: followerId as any },
            followee: { id: followeeId as any },
          },
        });
        if (existing) return existing;
      }
      throw e;
    }
  }

  /**
   * Soft-unfollow (recommended). If you prefer hard delete, call delete().
   */
  async unfollow(followerId: string | number, followeeId: string | number) {
    const edge = await this.repository.findOne({
      where: {
        follower: { id: followerId as any },
        followee: { id: followeeId as any },
        // if you store isDeleted flag on the row:
        // isDeleted: false,
      },
    });
    if (!edge) return; // idempotent

    // Soft approach: mark deleted flag (or use repository.softRemove if using TypeORM soft-delete)
    if ((edge as any).isDeleted !== undefined) {
      (edge as any).isDeleted = true;
      return this.repository.save(edge);
    }

    // Hard delete fallback
    await this.repository.remove(edge);
  }

  async isFollowing(
    followerId: string | number,
    followeeId: string | number,
  ): Promise<boolean> {
    const exists = await this.repository.exist({
      where: {
        follower: { id: followerId as any },
        followee: { id: followeeId as any },
        ...(this.hasIsDeletedColumn() ? { isDeleted: false as any } : {}),
        status: FollowStatus.ACCEPTED,
      },
    });
    return exists;
  }

  async countFollowers(userId: string | number): Promise<number> {
    return this.repository.count({
      where: {
        followee: { id: userId as any },
        ...(this.hasIsDeletedColumn() ? { isDeleted: false as any } : {}),
        status: FollowStatus.ACCEPTED,
      },
    });
  }

  async countFollowing(userId: string | number): Promise<number> {
    return this.repository.count({
      where: {
        follower: { id: userId as any },
        ...(this.hasIsDeletedColumn() ? { isDeleted: false as any } : {}),
        status: FollowStatus.ACCEPTED,
      },
    });
  }

  /**
   * Followers of a user (who follows ME)
   */
  async listFollowers(userId: string | number, params: FollowListParams = {}) {
    const page = Math.max(params.page || 1, 1);
    const pageSize = Math.max(params.pageSize || 20, 1);

    const qb = this.followersQB(userId, params);

    // Join follower user so you can return their profile fields
    qb.leftJoinAndSelect('f.follower', 'follower');

    this.applyUserQuickSearch(qb, params, 'follower');

    return this.paginate(
      { page, limit: pageSize },
      {}, // filter already in qb
      { id: 'DESC' }, // ignored because we pass qb with order
      { follower: true, followee: false },
      qb,
    );
  }

  /**
   * Who I follow (my following)
   */
  async listFollowing(userId: string | number, params: FollowListParams = {}) {
    const page = Math.max(params.page || 1, 1);
    const pageSize = Math.max(params.pageSize || 20, 1);

    const qb = this.followingQB(userId, params);

    // Join followee user so you can return their profile fields
    qb.leftJoinAndSelect('f.followee', 'followee');

    this.applyUserQuickSearch(qb, params, 'followee');

    return this.paginate(
      { page, limit: pageSize },
      {},
      { id: 'DESC' },
      { follower: false, followee: true },
      qb,
    );
  }

  async listPendingFollowers(
    userId: string | number,
    params: FollowListParams = {},
  ) {
    const page = Math.max(params.page || 1, 1);
    const pageSize = Math.max(params.pageSize || 20, 1);

    const qb = this.pendingFollowersQB(userId, params);

    // Join followee user so you can return their profile fields
    qb.leftJoinAndSelect('f.followee', 'followee');

    this.applyUserQuickSearch(qb, params, 'followee');

    return this.paginate(
      { page, limit: pageSize },
      {},
      { id: 'DESC' },
      { follower: false, followee: true },
      qb,
    );
  }

  // async getMutualFriends(
  //   followeeId: number | string,
  //   otherFollowerId: number | string,
  // ) {
  //   console.log(followeeId, otherFollowerId);
  //   const qb = this.repository
  //     .createQueryBuilder('f')
  //     // Get all followers of the followee
  //     .innerJoin('f.follower', 'follower')
  //     .innerJoin('f.followee', 'followee')
  //     .where('f.followee.id = :followeeId', { followeeId })
  //     .andWhere(
  //       'f.follower.id IN (SELECT f2.follower.id FROM user_follows f2 WHERE f2.followee.id = :otherFollowerId)',
  //       { otherFollowerId },
  //     )
  //     .leftJoinAndSelect('f.follower', 'follower') // Get follower details
  //     .leftJoinAndSelect('f.followee', 'followee'); // Get followee details

  //   const mutualFriends = await qb.getMany(); // Retrieve all mutual followers

  //   return mutualFriends;
  // }
  async getMutualFriends(
    followeeId: number | string,
    otherFollowerId: number | string,
  ) {
    const qb = this.repository
      .createQueryBuilder('f')
      // join once and select the relations
      .innerJoinAndSelect('f.follower', 'follower')
      .innerJoinAndSelect('f.followee', 'followee')
      // followers of this followee
      .where('followee.id = :followeeId', { followeeId })
      // who are also followers of otherFollowerId
      .andWhere(
        `
      follower.id IN (
        SELECT f2."follower_id"
        FROM "user_follows" f2
        WHERE f2."followee_id" = :otherFollowerId
      )
    `,
        { otherFollowerId },
      );

    const mutualFriends = await qb.getMany();
    return mutualFriends;
  }

  /**
   * Retrieve a specific follow edge.
   */
  async getEdge(followerId: number | string, followeeId: number | string) {
    const edge = await this.repository.findOne({
      where: {
        follower: { id: followerId as any },
        followee: { id: followeeId as any },
      },
      relations: ['follower', 'followee'],
      withDeleted: true,
    });
    if (!edge) throw new NotFoundException('Follow not found');
    return edge;
  }

  /**
   * Accept a pending follow (for private accounts).
   */
  async accept(followerId: number | string, followeeId: number | string) {
    const edge = await this.repository.findOne({
      where: {
        follower: { id: followerId as any },
        followee: { id: followeeId as any },
        status: FollowStatus.PENDING,
        ...(this.hasIsDeletedColumn() ? { isDeleted: false as any } : {}),
      },
    });
    if (!edge) throw new NotFoundException('Follow request not found');
    edge.status = FollowStatus.ACCEPTED;
    return this.repository.save(edge);
  }

  /**
   * Decline (soft-delete) a pending follow request.
   */
  async decline(followerId: number | string, followeeId: number | string) {
    const edge = await this.repository.findOne({
      where: {
        follower: { id: followerId as any },
        followee: { id: followeeId as any },
        status: FollowStatus.PENDING,
        ...(this.hasIsDeletedColumn() ? { isDeleted: false as any } : {}),
      },
    });
    if (!edge) return;
    if ((edge as any).isDeleted !== undefined) {
      (edge as any).isDeleted = true;
      return this.repository.save(edge);
    }
    await this.repository.remove(edge);
  }

  // ----------------------------
  // Internals / Query builders
  // ----------------------------

  private baseQB(): SelectQueryBuilder<FollowEntity> {
    return this.repository.createQueryBuilder('f');
  }

  private pendingFollowersQB(
    userId: string | number,
    params: FollowListParams,
  ): SelectQueryBuilder<FollowEntity> {
    const qb = this.baseQB()
      .where('f.followee_id = :uid', { uid: userId })
      .andWhere('f.status = :st', { st: FollowStatus.PENDING });

    if (!params.includeDeleted && this.hasIsDeletedColumn()) {
      qb.andWhere('f.isDeleted = false');
    }

    const orderBy = params.orderBy || 'created_at';
    const orderDir = params.orderDir || 'DESC';
    qb.orderBy(`f.${orderBy}`, orderDir);

    return qb;
  }

  private followersQB(
    userId: string | number,
    params: FollowListParams,
  ): SelectQueryBuilder<FollowEntity> {
    const qb = this.baseQB()
      .where('f.followee_id = :uid', { uid: userId })
      .andWhere('f.status = :st', { st: FollowStatus.ACCEPTED });

    if (!params.includeDeleted && this.hasIsDeletedColumn()) {
      qb.andWhere('f.isDeleted = false');
    }

    const orderBy = params.orderBy || 'created_at';
    const orderDir = params.orderDir || 'DESC';
    qb.orderBy(`f.${orderBy}`, orderDir);

    return qb;
  }

  private followingQB(
    userId: string | number,
    params: FollowListParams,
  ): SelectQueryBuilder<FollowEntity> {
    const qb = this.baseQB()
      .where('f.follower_id = :uid', { uid: userId })
      .andWhere('f.status = :st', { st: FollowStatus.ACCEPTED });

    if (!params.includeDeleted && this.hasIsDeletedColumn()) {
      qb.andWhere('f.isDeleted = false');
    }

    const orderBy = params.orderBy || 'created_at';
    const orderDir = params.orderDir || 'DESC';
    qb.orderBy(`f.${orderBy}`, orderDir);

    return qb;
  }

  /**
   * Optional free-text search across joined user fields.
   * `alias` is either 'follower' or 'followee' depending on the join above.
   */
  private applyUserQuickSearch(
    qb: SelectQueryBuilder<FollowEntity>,
    params: FollowListParams,
    alias: 'follower' | 'followee',
  ) {
    if (!params.q) return;
    const q = `%${params.q.toLowerCase()}%`;
    qb.andWhere(
      `(LOWER(${alias}.first_name) ILIKE :q OR LOWER(${alias}.last_name) ILIKE :q OR LOWER(${alias}.email_address) ILIKE :q OR ${alias}.phone_no ILIKE :q)`,
      { q },
    );
  }

  /**
   * Helper: detect if your FollowEntity has an isDeleted boolean column.
   * If you instead use TypeORM soft-delete, adapt calls (withDeleted/softRemove).
   */
  private hasIsDeletedColumn(): boolean {
    // crude detection; adjust if you prefer a constant
    return this.repository.metadata.columns.some(
      (c) => c.propertyName === 'isDeleted',
    );
  }

  async getUserContentFeed(userId: number | string) {
    // 1. Get posts by this user
    const posts = await this.postRepo
      .createQueryBuilder('post')
      .innerJoin('post.user', 'user')
      .where('user.id = :userId', { userId })
      .andWhere('post.isActive = :isActive', { isActive: true })
      .orderBy('post.createdAt', 'DESC')
      .getMany();

    // 2. Get prayers by this user
    const prayers = await this.prayerRepo
      .createQueryBuilder('prayer')
      .innerJoin('prayer.user', 'user')
      .where('user.id = :userId', { userId })
      .andWhere('prayer.isVisible = :visible', { visible: true })
      .orderBy('prayer.createdAt', 'DESC')
      .getMany();

    // 3. Normalise into a single feed list
    const feed = [
      ...posts.map((p) => ({
        id: p.id,
        type: 'post' as const,
        title: p.title,
        body: p.body,
        createdAt: p.createdAt,
        stats: {
          comments: p.commentCount,
          likes: p.likeCount,
          amens: 0, // posts don't have amens
        },
      })),
      ...prayers.map((pr) => ({
        id: pr.id,
        type: 'prayer' as const,
        title: pr.title,
        body: pr.body,
        createdAt: pr.createdAt,
        stats: {
          comments: pr.commentCount,
          likes: 0, // prayers don't have likes
          amens: pr.amenCount,
        },
      })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return feed;
  }
}
