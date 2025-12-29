import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Brackets } from 'typeorm';
import { BaseRepository } from '../base.repository';
import { paginateRaw } from 'nestjs-typeorm-paginate';

import { PostEntity } from 'src/database/entities/post.entity';
import { PostLikeEntity } from 'src/database/entities/post-like.entity';
import { PostCommentEntity } from 'src/database/entities/post-comment.entity';
import { PostShareEntity } from 'src/database/entities/post-share.entity';
// import { UserEntity } from 'src/database/entities/user.entity';
import { DeepPartial } from 'typeorm';

export interface PostSearchParams {
  page?: number;
  pageSize?: number;
  q?: string; // free-text on post body
  orderBy?: 'createdAt' | 'id';
  orderDir?: 'ASC' | 'DESC';
}

export interface CommentSearchParams {
  postId: number;
  page?: number;
  pageSize?: number;
  orderBy?: 'createdAt' | 'id';
  orderDir?: 'ASC' | 'DESC';
}

@Injectable()
export class PostRepository extends BaseRepository<
  PostEntity,
  Repository<PostEntity>
> {
  protected logger = new Logger(PostRepository.name);

  constructor(
    @InjectRepository(PostEntity) postRepo: Repository<PostEntity>,
    @InjectRepository(PostLikeEntity)
    private readonly likeRepo: Repository<PostLikeEntity>,
    @InjectRepository(PostCommentEntity)
    private readonly commentRepo: Repository<PostCommentEntity>,
    @InjectRepository(PostShareEntity)
    private readonly shareRepo: Repository<PostShareEntity>,
  ) {
    super(postRepo);
  }

  // ---------- Base query builder ----------
  private baseQB(
    params: PostSearchParams = {},
  ): SelectQueryBuilder<PostEntity> {
    const qb = this.query('p')
      .leftJoin('p.user', 'user') // not AndSelect; we'll control selection explicitly
      .select([
        // --- Post fields you want ---
        'p.id',
        'p.body',
        'p.createdAt',

        // --- Minimal user fields (must include user.id to hydrate relation) ---
        'user.id',
        'user.first_name', // or 'user.first_name' if your column/property is snake_case
        'user.last_name', // or 'user.last_name'
        'user.profilePicture', // or 'user.profile_picture'
      ]);

    if (params.q) {
      const q = `%${params.q.toLowerCase()}%`;
      qb.andWhere('LOWER(p.body) ILIKE :q', { q });
    }

    qb.orderBy(`p.${params.orderBy || 'id'}`, params.orderDir || 'DESC');
    return qb;
  }

  // ---------- Create Post ----------
  async createPost({
    body,
    userId,
    title,
  }: {
    body: string;
    userId: number;
    title?: string;
  }): Promise<PostEntity> {
    const entity = this.repository.create({
      body,
      user: { id: userId } as any, // associating user
      title: title ?? null, // optional title
    });

    return this.save(entity);
  }

  // ---------- Update Post ----------
  async updatePost(
    postId: number,
    { body, title }: { body: string; title?: string },
  ): Promise<PostEntity> {
    const post = await this.findOne(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    post.body = body;
    post.title = title ?? post.title;

    return this.save(post);
  }

  // async getPost(postId: number, currentUserId?: number) {
  //   const post = await this.baseQB()
  //     .where('p.id = :postId', { postId })
  //     .getOne();

  //   if (!post) {
  //     throw new Error('Post not found');
  //   }

  //   // Check if the post has been liked by the current user (if any)
  //   const likedByMe = currentUserId
  //     ? await this.likeRepo.exists({
  //         where: { post: { id: postId }, user: { id: currentUserId } },
  //       })
  //     : false;

  //   return { ...post, likedByMe };
  // }

  //   // ---------- Delete Post ----------
  //   async deletePost(
  //     postId: number,
  //     userId: number,
  //     isAdmin: boolean,
  //   ): Promise<boolean> {
  //     const post = await this.findOne(postId);
  //     if (!post) {
  //       throw new NotFoundException('Post not found');
  //     }

  //     // Check if the current user is either the post owner or an admin
  //     if (post.user.id !== userId || !isAdmin) {
  //       throw new ForbiddenException(
  //         'You are not authorized to delete this post',
  //       );
  //     }

  //     // Delete the post
  //     await this.softDelete(postId);
  //     return true;
  //   }

  // ---------- Get Paginated Posts with Like Status ----------
  // async getPosts(
  //   params: PostSearchParams,
  //   currentUserId?: number,
  // ): Promise<any> {
  //   const page = Math.max(params.page || 1, 1);
  //   const pageSize = Math.max(params.pageSize || 20, 1);
  //   const qb = this.baseQB(params);

  //   // Fetch posts with pagination
  //   const [posts, total] = await qb
  //     .skip((page - 1) * pageSize)
  //     .take(pageSize)
  //     .leftJoin('p.user', 'u')
  //     .getManyAndCount();

  //   // If currentUserId is provided, check if the current user liked each post
  //   if (currentUserId) {
  //     const likedPostIds = (
  //       await this.likeRepo
  //         .createQueryBuilder('like')
  //         .select('like.postId')
  //         .where('like.userId = :userId', { userId: currentUserId })
  //         .getRawMany()
  //     ).map((like) => like.postId);

  //     // Attach likedByMe flag to each post
  //     const postsWithLikeStatus = posts.map((post) => ({
  //       ...post,
  //       likedByMe: likedPostIds.includes(post.id),
  //     }));

  //     return {
  //       posts: postsWithLikeStatus,
  //       total,
  //       page,
  //       pageSize,
  //     };
  //   }

  //   return {
  //     posts,
  //     total,
  //     page,
  //     pageSize,
  //   };
  // }

  async getPost(postId: number, currentUserId?: number) {
    const post = await this.baseQB()
      .where('p.id = :postId', { postId })
      .getOne();

    if (!post) throw new NotFoundException('Post not found');

    const likedByMe = currentUserId
      ? await this.likeRepo.exists({
          where: { post: { id: postId }, user: { id: currentUserId } },
        })
      : false;

    const counts = await this.getEngagementCounts([postId]);
    const c = counts.get(postId) ?? {
      likeCount: 0,
      commentCount: 0,
      shareCount: 0,
    };

    return {
      ...post,
      likedByMe,
      likeCount: c.likeCount,
      commentCount: c.commentCount,
      shareCount: c.shareCount,
    };
  }

  async getPosts(params: PostSearchParams, currentUserId?: number) {
    const page = Math.max(params.page || 1, 1);
    const pageSize = Math.max(params.pageSize || 20, 1);
    const qb = this.baseQB(params);

    const [posts, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    const postIds = posts.map((p) => p.id);

    // likedByMe set
    let likedPostIds: number[] = [];
    if (currentUserId && postIds.length) {
      likedPostIds = (
        await this.likeRepo
          .createQueryBuilder('like')
          .select('like.postId', 'postId')
          .where('like.userId = :userId', { userId: currentUserId })
          .andWhere('like.postId IN (:...ids)', { ids: postIds })
          .getRawMany<{ postId: number }>()
      ).map((r) => r.postId);
    }

    // counts
    const countsMap = await this.getEngagementCounts(postIds);

    const items = posts.map((p) => ({
      ...p,
      likedByMe: currentUserId ? likedPostIds.includes(p.id) : false,
      likeCount: countsMap.get(p.id)?.likeCount ?? 0,
      commentCount: countsMap.get(p.id)?.commentCount ?? 0,
      shareCount: countsMap.get(p.id)?.shareCount ?? 0,
    }));

    return { posts: items, total, page, pageSize };
  }

  // ---------- Likes ----------
  async likeExists(postId: number, userId: number) {
    return this.likeRepo.exists({
      where: { post: { id: postId }, user: { id: userId } },
    });
  }

  async addLike(postId: number, userId: number) {
    return this.likeRepo
      .createQueryBuilder()
      .insert()
      .into(PostLikeEntity)
      .values({
        post: { id: postId } as any,
        user: { id: userId } as any,
      })
      .orIgnore() // ON CONFLICT DO NOTHING (PG)
      .execute();
  }

  async removeLike({ postId, userId }: { postId: number; userId: number }) {
    try {
      const like = await this.likeRepo.findOne({
        where: { post: { id: postId }, user: { id: userId } },
        relations: { post: true, user: true },
      });
      if (!like) return false;
      await this.likeRepo.delete(like.id);
      return true;
    } catch (error) {
      throw Error(error);
    }
  }

  async addComment({
    postId,
    userId,
    comment,
  }: {
    postId: number;
    userId: number;
    comment: string;
  }) {
    const data = {
      body: comment,
      post: { id: postId } as any,
      user: { id: userId } as any,
    } satisfies DeepPartial<PostCommentEntity>;

    const entity = this.commentRepo.create(data);
    return this.commentRepo.save(entity);
  }

  async deleteComment(
    commentId: number,
    where?: { userId?: number; isAdmin?: boolean },
  ) {
    if (where?.isAdmin) {
      await this.commentRepo.delete({ id: commentId } as any);
      return true;
    }
    if (where?.userId) {
      const own = await this.commentRepo.findOne({
        where: { id: commentId, user: { id: where.userId } as any },
        relations: { user: true },
      });
      if (!own) return false;
      await this.commentRepo.delete({ id: commentId } as any);
      return true;
    }
    return false;
  }

  async addShare(postId: number, userId: number) {
    const data = {
      post: { id: postId } as any,
      user: { id: userId } as any,
    } satisfies DeepPartial<PostShareEntity>;

    const entity = this.shareRepo.create(data);
    return this.shareRepo.save(entity);
  }

  async incrementShareCount(postId: number) {
    try {
      await this.repository
        .createQueryBuilder()
        .update(PostEntity)
        .set({ shareCount: () => '"shareCount" + 1' })
        .where('id = :id', { id: postId })
        .execute();
      return true;
    } catch (e) {
      this.logger.error(e.stack);
      return false;
    }
  }

  async getShares(postId: number) {
    return this.shareRepo.find({ where: { post: { id: postId } } });
  }

  async listCommentsPaginated(params: CommentSearchParams) {
    const page = Math.max(params.page || 1, 1);
    const limit = Math.max(params.pageSize || 20, 1);

    const qb = this.commentRepo
      .createQueryBuilder('c')
      .leftJoin('c.user', 'u')
      .innerJoin('c.post', 'p')
      .select([
        'c.id AS id',
        'c.body AS comment',
        'c.createdAt AS "createdAt"',
        `COALESCE(NULLIF(TRIM(CONCAT_WS(' ', u.first_name, u.last_name)), ''), u."user_name") AS "displayName"`,
        'u.profilePicture AS "profile_picture"',
        'u.id AS "userId"'
      ])
      .where('p.id = :id', { id: params.postId })
      .orderBy(`c.${params.orderBy || 'id'}`, params.orderDir || 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await Promise.all([
      qb.getRawMany(),
      this.commentRepo
        .createQueryBuilder('c2')
        .innerJoin('c2.post', 'p2')
        .where('p2.id = :id', { id: params.postId })
        .getCount(),
    ]);

    return { items, total, page, pageSize: limit };
  }

  async getMyPosts(userId: number, params: PostSearchParams): Promise<any> {
    const page = Math.max(params.page || 1, 1);
    const pageSize = Math.max(params.pageSize || 20, 1);
    const qb = this.baseQB(params);

    // Ensure that the user relation is joined and filter by userId
    qb.leftJoinAndSelect('p.user', 'user').where('user.id = :userId', {
      userId,
    });

    // Fetch posts with pagination
    const [posts, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    // If currentUserId is provided, check if the current user liked each post
    if (userId) {
      const likedPostIds = (
        await this.likeRepo
          .createQueryBuilder('like')
          .select('like.postId') // This should be 'like.postId' assuming it's directly on the 'PostLikeEntity'
          .where('like.userId = :userId', { userId })
          .getRawMany()
      ).map((like) => like.postId);

      // Attach likedByMe flag to each post
      const postsWithLikeStatus = posts.map((post) => ({
        ...post,
        likedByMe: likedPostIds.includes(post.id),
      }));

      return {
        posts: postsWithLikeStatus,
        total,
        page,
        pageSize,
      };
    }

    return {
      posts,
      total,
      page,
      pageSize,
    };
  }

  private async getEngagementCounts(postIds: number[]) {
    if (postIds.length === 0)
      return new Map<
        number,
        { likeCount: number; commentCount: number; shareCount: number }
      >();

    // Likes
    const likes = await this.likeRepo
      .createQueryBuilder('l')
      .select('l.postId', 'postId')
      .addSelect('COUNT(*)', 'cnt')
      .where('l.postId IN (:...ids)', { ids: postIds })
      .groupBy('l.postId')
      .getRawMany<{ postId: number; cnt: string }>();

    // Comments
    const comments = await this.commentRepo
      .createQueryBuilder('c')
      .select('c.postId', 'postId')
      .addSelect('COUNT(*)', 'cnt')
      .where('c.postId IN (:...ids)', { ids: postIds })
      .groupBy('c.postId')
      .getRawMany<{ postId: number; cnt: string }>();

    // Shares
    const shares = await this.shareRepo
      .createQueryBuilder('s')
      .select('s.postId', 'postId')
      .addSelect('COUNT(*)', 'cnt')
      .where('s.postId IN (:...ids)', { ids: postIds })
      .groupBy('s.postId')
      .getRawMany<{ postId: number; cnt: string }>();

    // Merge into a map
    const map = new Map<
      number,
      { likeCount: number; commentCount: number; shareCount: number }
    >();
    for (const id of postIds)
      map.set(id, { likeCount: 0, commentCount: 0, shareCount: 0 });

    for (const r of likes) map.get(Number(r.postId))!.likeCount = Number(r.cnt);
    for (const r of comments)
      map.get(Number(r.postId))!.commentCount = Number(r.cnt);
    for (const r of shares)
      map.get(Number(r.postId))!.shareCount = Number(r.cnt);

    return map;
  }
}
