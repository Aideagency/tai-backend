// src/repository/nugget/nugget.repository.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Brackets } from 'typeorm';
import { BaseRepository } from '../base.repository';
import { paginateRaw } from 'nestjs-typeorm-paginate';

import { NuggetEntity, NuggetType } from 'src/database/entities/nugget.entity';
import { NuggetLikeEntity } from 'src/database/entities/nugget-like.entity';
import { NuggetCommentEntity } from 'src/database/entities/nugget-comment.entity';
import { DeepPartial } from 'typeorm';
import { AdminEntity } from 'src/database/entities/admin.entity';

export interface NuggetSearchParams {
  page?: number;
  pageSize?: number;
  q?: string; // free-text on nugget body
  nuggetType?: NuggetType;
  adminId?: number;
  dateFrom?: Date;
  dateTo?: Date;
  orderBy?: 'createdAt' | 'publishAt' | 'id';
  orderDir?: 'ASC' | 'DESC';
}

export interface CommentSearchParams {
  nuggetId: number;
  page?: number;
  pageSize?: number;
  orderBy?: 'createdAt' | 'id';
  orderDir?: 'ASC' | 'DESC';
}

@Injectable()
export class NuggetRepository extends BaseRepository<
  NuggetEntity,
  Repository<NuggetEntity>
> {
  protected logger = new Logger(NuggetRepository.name);

  constructor(
    @InjectRepository(NuggetEntity) nuggetRepo: Repository<NuggetEntity>,
    @InjectRepository(NuggetLikeEntity)
    private readonly likeRepo: Repository<NuggetLikeEntity>,
    @InjectRepository(NuggetCommentEntity)
    private readonly commentRepo: Repository<NuggetCommentEntity>,
  ) {
    super(nuggetRepo);
  }

  // ---------- Base query builder ----------
  private baseQB(
    params: NuggetSearchParams = {},
  ): SelectQueryBuilder<NuggetEntity> {
    const qb = this.query('n').leftJoinAndSelect('n.admin', 'admin');

    if (params.q) {
      const q = `%${params.q.toLowerCase()}%`;
      qb.andWhere('LOWER(n.body) ILIKE :q', { q });
    }

    if (params.nuggetType) {
      qb.andWhere('n.nuggetType = :type', { type: params.nuggetType });
    }

    if (params.adminId) {
      qb.andWhere('admin.id = :adminId', { adminId: params.adminId });
    }

    if (params.dateFrom) {
      qb.andWhere(
        new Brackets((b) =>
          b.where('COALESCE(n.publishAt, n.createdAt) >= :df', {
            df: params.dateFrom,
          }),
        ),
      );
    }

    if (params.dateTo) {
      qb.andWhere(
        new Brackets((b) =>
          b.where('COALESCE(n.publishAt, n.createdAt) <= :dt', {
            dt: params.dateTo,
          }),
        ),
      );
    }

    qb.orderBy(`n.${params.orderBy || 'id'}`, params.orderDir || 'DESC');
    return qb;
  }

  // ---------- Search / Pagination ----------
  async searchPaginated(params: NuggetSearchParams) {
    const page = Math.max(params.page || 1, 1);
    const pageSize = Math.max(params.pageSize || 20, 1);
    const qb = this.baseQB(params);
    return this.paginate({ page, limit: pageSize }, {}, { id: 'DESC' }, {}, qb);
  }

  // ---------- Create / Update ----------
  async createNugget(payload: {
    body: string;
    nuggetType: NuggetType;
    adminId?: number | null;
    publishAt?: Date | null;
    title?: string | null;
  }): Promise<NuggetEntity | undefined> {
    const entity = this.repository.create({
      publishAt: payload.publishAt ?? null,
      admin: payload.adminId ? ({ id: payload.adminId } as AdminEntity) : null,
      body: payload.body,
      nuggetType: payload.nuggetType,
      title: payload.title ?? null,
    } as DeepPartial<NuggetEntity>);
    return this.save(entity);
  }

  // Optional: increment share counter if your entity has it
  async incrementShareCount(nuggetId: number) {
    try {
      await this.repository
        .createQueryBuilder()
        .update(NuggetEntity)
        .set({ shareCount: () => '"shareCount" + 1' }) // requires a numeric column in entity
        .where('id = :id', { id: nuggetId })
        .execute();
      return true;
    } catch (e) {
      this.logger.error(e.stack);
      return false;
    }
  }

  // ---------- Fetch daily / latest ----------
  async getTodayNugget(type?: NuggetType) {
    const qb = this.baseQB({ nuggetType: type })
      .andWhere('DATE(COALESCE(n.publishAt, n.createdAt)) = CURRENT_DATE')
      .orderBy('COALESCE(n.publishAt, n.createdAt)', 'DESC')
      .limit(1);

    return qb.getOne();
  }

  async getLatestNugget(type?: NuggetType) {
    return this.baseQB({ nuggetType: type })
      .orderBy('COALESCE(n.publishAt, n.createdAt)', 'DESC')
      .limit(1)
      .getOne();
  }

  // ---------- Engagement / details ----------
  async getEngagementCounts(nuggetId: number, currentUserId?: number) {
    const [likesCount, commentsCount, likedByMe] = await Promise.all([
      this.likeRepo.count({ where: { nugget: { id: nuggetId } } }),
      this.commentRepo.count({ where: { nugget: { id: nuggetId } } }),
      currentUserId
        ? this.likeRepo.exists({
            where: { nugget: { id: nuggetId }, user: { id: currentUserId } },
          })
        : Promise.resolve(false),
    ]);
    return {
      likesCount,
      commentsCount,
      likedByMe: !!likedByMe,
    };
  }

  async getNuggetWithAdmin(nuggetId: number) {
    return this.query('n')
      .leftJoinAndSelect('n.admin', 'admin')
      .where('n.id = :id', { id: nuggetId })
      .getOne();
  }

  // ---------- Likes ----------
  async likeExists(nuggetId: number, userId: number) {
    return this.likeRepo.exists({
      where: { nugget: { id: nuggetId }, user: { id: userId } },
    });
  }

  async addLike(nuggetId: number, userId: number) {
    const like = this.likeRepo.create({
      nugget: { id: nuggetId } as any,
      user: { id: userId } as any,
    });
    return this.likeRepo.save(like);
  }

  async removeLike(nuggetId: number, userId: number) {
    await this.likeRepo.delete({
      nugget: { id: nuggetId } as any,
      user: { id: userId } as any,
    });
    return true;
  }

  // ---------- Comments ----------
  async addComment(nuggetId: number, userId: number, comment: string) {
    const data = {
      comment,
      nugget: { id: nuggetId } as any,
      user: { id: userId } as any,
    } satisfies DeepPartial<NuggetCommentEntity>; // helps TS verify keys

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

  async listCommentsPaginated(params: CommentSearchParams) {
    const page = Math.max(params.page || 1, 1);
    const limit = Math.max(params.pageSize || 20, 1);

    const qb = this.commentRepo
      .createQueryBuilder('c')
      .leftJoin('c.user', 'u') // join without auto-selecting entity
      .select([
        'c.id AS id',
        'c.comment AS comment',
        'c.createdAt AS "createdAt"',
        `COALESCE(NULLIF(trim(concat_ws(' ', u.first_name, u.last_name)), ''), u."userName", '') AS "displayName"`,
      ])
      .where('c.id = :id', { id: params.nuggetId }) // <-- correct filter
      .orderBy(`c.${params.orderBy || 'id'}`, params.orderDir || 'DESC');

    // IMPORTANT: pass the QB itself (no getRawMany here)
    return paginateRaw(qb, { page, limit });
  }
}
