// src/repository/nugget/nugget.repository.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Brackets, DataSource } from 'typeorm';
import { BaseRepository } from '../base.repository';
import { paginateRaw } from 'nestjs-typeorm-paginate';

import { NuggetEntity, NuggetType } from 'src/database/entities/nugget.entity';
import { NuggetLikeEntity } from 'src/database/entities/nugget-like.entity';
import { NuggetCommentEntity } from 'src/database/entities/nugget-comment.entity';
import { DeepPartial } from 'typeorm';
import { AdminEntity } from 'src/database/entities/admin.entity';
import { DailyNuggetEntity } from 'src/database/entities/daily-nugget.entity';
import { NuggetRotationStateEntity } from 'src/database/entities/nugget-rotation-state.entity';

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
    private readonly dataSource: DataSource,
    @InjectRepository(NuggetEntity) nuggetRepo: Repository<NuggetEntity>,
    @InjectRepository(NuggetLikeEntity)
    private readonly likeRepo: Repository<NuggetLikeEntity>,
    @InjectRepository(NuggetCommentEntity)
    private readonly commentRepo: Repository<NuggetCommentEntity>,
    @InjectRepository(DailyNuggetEntity)
    private readonly dailyRepo: Repository<DailyNuggetEntity>,

    @InjectRepository(NuggetRotationStateEntity)
    private readonly rotationRepo: Repository<NuggetRotationStateEntity>,
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

  async getRandomNugget() {
    const qb = this.baseQB();

    // Random ordering depends on your DB:
    // PostgreSQL: RANDOM()
    // MySQL/MariaDB: RAND()
    qb.orderBy('RANDOM()').limit(1);

    return qb.getOne();
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
    // Option A: relation-style (fine for find/exist)
    return this.likeRepo.exists({
      where: { nugget: { id: nuggetId }, user: { id: userId } },
    });
  }

  async getNuggetWithEngagementStats(nuggetId: number) {
    const qb = this.query('n')
      .leftJoinAndSelect('n.admin', 'admin')

      // likes count
      .addSelect((sub) => {
        return sub
          .select('COUNT(1)', 'cnt')
          .from(NuggetLikeEntity, 'nl')
          .where('nl.nugget.id = n.id');
      }, 'likesCount')

      // comments count
      .addSelect((sub) => {
        return sub
          .select('COUNT(1)', 'cnt')
          .from(NuggetCommentEntity, 'nc')
          .where('nc.nugget.id = n.id');
      }, 'commentsCount')

      .where('n.id = :id', { id: nuggetId });

    const { entities, raw } = await qb.getRawAndEntities();

    const nugget = entities?.[0];
    if (!nugget) return null;

    const row = raw?.[0] ?? {};
    const likesCount = Number(row.likesCount ?? 0);
    const commentsCount = Number(row.commentsCount ?? 0);

    // if your NuggetEntity has shareCount, return it from the entity itself
    const shareCount = Number((nugget as any).shareCount ?? 0);

    return {
      nugget,
      engagement: {
        likesCount,
        commentsCount,
        shareCount,
      },
    };
  }

  // ✅ ADD — insert without loading entities; rely on unique constraint
  async addLike(nuggetId: number, userId: number) {
    // If you’re on Postgres, you can use .orIgnore() pattern:
    return this.likeRepo
      .createQueryBuilder()
      .insert()
      .into(NuggetLikeEntity)
      .values({
        nugget: { id: nuggetId } as any,
        user: { id: userId } as any,
        // reaction: NuggetReaction.LIKE, // if you need a specific reaction
      })
      .orIgnore() // ON CONFLICT DO NOTHING (PG)
      .execute();
  }

  async removeLike(nuggetId: number, userId: number) {
    try {
      const like = await this.likeRepo.findOne({
        where: { nugget: { id: nuggetId }, user: { id: userId } },
        relations: { nugget: true, user: true },
      });
      if (!like) return false;
      await this.likeRepo.delete(like.id);
      return true;
    } catch (error) {
      throw Error(error);
    }
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
        `COALESCE(NULLIF(trim(concat_ws(' ', u.first_name, u.last_name)), ''), u."user_name", '') AS "displayName"`,
        'u.id AS userId',
      ])
      .where('c.nugget.id = :id', { id: params.nuggetId }) // <-- correct filter
      .orderBy(`c.${params.orderBy || 'id'}`, params.orderDir || 'DESC');

    // IMPORTANT: pass the QB itself (no getRawMany here)
    return paginateRaw(qb, { page, limit });
  }

  private toDateKeyUTC(d = new Date()): string {
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  async getDailyRotatingNugget(
    type: NuggetType = NuggetType.GENERAL,
    now = new Date(),
  ) {
    const dateKey = this.toDateKeyUTC(now);

    // Fast path: read cached mapping for today
    const cached = await this.dailyRepo.findOne({
      where: { dateKey, nuggetType: type },
      relations: { nugget: true },
    });
    if (cached?.nugget) return cached.nugget;

    // Transaction: assign today's nugget atomically
    return this.dataSource.transaction(async (manager) => {
      const dailyRepoTxn = manager.getRepository(DailyNuggetEntity);
      const rotationRepoTxn = manager.getRepository(NuggetRotationStateEntity);
      const nuggetRepoTxn = manager.getRepository(NuggetEntity);

      // Re-check inside txn (handles race)
      const existing = await dailyRepoTxn.findOne({
        where: { dateKey, nuggetType: type },
        relations: { nugget: true },
      });
      if (existing?.nugget) return existing.nugget;

      // Lock rotation row for this type
      let state = await rotationRepoTxn
        .createQueryBuilder('s')
        .setLock('pessimistic_write')
        .where('s.nuggetType = :type', { type })
        .getOne();

      if (!state) {
        state = rotationRepoTxn.create({
          nuggetType: type,
          lastNuggetId: 0,
          lastDateKey: null,
        });
        state = await rotationRepoTxn.save(state);
      }

      const lastId = state.lastNuggetId ?? 0;

      // Next by id ASC after lastId
      let next = await nuggetRepoTxn
        .createQueryBuilder('n')
        .where('n.isActive = true')
        .andWhere('n.nuggetType = :type', { type })
        .andWhere('n.id > :lastId', { lastId })
        .orderBy('n.id', 'ASC')
        .limit(1)
        .getOne();

      // Wrap to first
      if (!next) {
        next = await nuggetRepoTxn
          .createQueryBuilder('n')
          .where('n.isActive = true')
          .andWhere('n.nuggetType = :type', { type })
          .orderBy('n.id', 'ASC')
          .limit(1)
          .getOne();
      }

      if (!next) return null; // no active nuggets of this type

      // Insert today's mapping (unique index prevents duplicates)
      try {
        await dailyRepoTxn.insert({
          dateKey,
          nuggetType: type,
          nuggetId: next.id,
        });
      } catch (e: any) {
        // If another instance inserted first, just return what exists
        const already = await dailyRepoTxn.findOne({
          where: { dateKey, nuggetType: type },
          relations: { nugget: true },
        });
        return already?.nugget ?? next;
      }

      // Update cursor
      state.lastNuggetId = next.id;
      state.lastDateKey = dateKey;
      await rotationRepoTxn.save(state);

      return next;
    });
  }
}
