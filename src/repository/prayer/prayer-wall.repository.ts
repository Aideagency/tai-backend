import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Brackets, DeepPartial } from 'typeorm';
import { paginateRaw } from 'nestjs-typeorm-paginate';

import { BaseRepository } from '../base.repository';
import { PrayerWallEntity } from 'src/database/entities/prayer-wall.entity';
import {
  PrayerAmenEntity,
  PrayerAmenReaction,
} from 'src/database/entities/prayer-amen.entity';
import { PrayerCommentEntity } from 'src/database/entities/prayer-comment.entity';
import { UserEntity } from 'src/database/entities/user.entity';

export interface PrayerSearchParams {
  page?: number;
  pageSize?: number;
  /** free-text on title/body */
  q?: string;
  /** filter by author */
  userId?: number;
  /** filter by answered state */
  isAnswered?: boolean;
  /** filter by visibility */
  isVisible?: boolean;
  /** createdAt range */
  dateFrom?: Date;
  dateTo?: Date;
  /** sorting */
  orderBy?:
    | 'createdAt'
    | 'lastActivityAt'
    | 'amenCount'
    | 'commentCount'
    | 'shareCount'
    | 'id';
  orderDir?: 'ASC' | 'DESC';
}

export interface PrayerCommentSearchParams {
  prayerId: number;
  page?: number;
  pageSize?: number;
  orderBy?: 'createdAt' | 'id';
  orderDir?: 'ASC' | 'DESC';
}

@Injectable()
export class PrayerWallRepository extends BaseRepository<
  PrayerWallEntity,
  Repository<PrayerWallEntity>
> {
  protected logger = new Logger(PrayerWallRepository.name);

  constructor(
    @InjectRepository(PrayerWallEntity)
    prayerRepo: Repository<PrayerWallEntity>,
    @InjectRepository(PrayerAmenEntity)
    private readonly amenRepo: Repository<PrayerAmenEntity>,
    @InjectRepository(PrayerCommentEntity)
    private readonly commentRepo: Repository<PrayerCommentEntity>,
  ) {
    super(prayerRepo);
  }

  // ---------- Base query builder ----------
  private baseQB(
    params: PrayerSearchParams = {},
  ): SelectQueryBuilder<PrayerWallEntity> {
    const qb = this.query('p')
      .leftJoin('p.user', 'u') // Use leftJoin instead of leftJoinAndSelect
      .addSelect(['u.first_name', 'u.last_name']);

    if (params.q) {
      const q = `%${params.q.toLowerCase()}%`;
      qb.andWhere(
        new Brackets((b) =>
          b
            .where('LOWER(p.body) ILIKE :q', { q })
            .orWhere('LOWER(p.title) ILIKE :q', { q }),
        ),
      );
    }

    if (typeof params.userId === 'number') {
      qb.andWhere('u.id = :userId', { userId: params.userId });
    }

    if (typeof params.isAnswered === 'boolean') {
      qb.andWhere('p.isAnswered = :ans', { ans: params.isAnswered });
    }

    if (typeof params.isVisible === 'boolean') {
      qb.andWhere('p.isVisible = :vis', { vis: params.isVisible });
    }

    if (params.dateFrom) {
      qb.andWhere('p.createdAt >= :df', { df: params.dateFrom });
    }

    if (params.dateTo) {
      qb.andWhere('p.createdAt <= :dt', { dt: params.dateTo });
    }

    qb.orderBy(`p.${params.orderBy || 'id'}`, params.orderDir || 'DESC');
    return qb;
  }

  // ---------- Search / Pagination ----------
  async searchPaginated(params: PrayerSearchParams) {
    const page = Math.max(params.page || 1, 1);
    const pageSize = Math.max(params.pageSize || 20, 1);
    const qb = this.baseQB(params);
    return this.paginate({ page, limit: pageSize }, {}, { id: 'DESC' }, {}, qb);
  }

  // ---------- Create ----------
  async createPrayer(payload: {
    body: string;
    userId?: number | null;
    title?: string | null;
    isAnonymous?: boolean;
    sourceAttribution?: string | null;
  }): Promise<PrayerWallEntity | undefined> {
    const entity = this.repository.create({
      body: payload.body,
      title: payload.title ?? null,
      isAnonymous: payload.isAnonymous ?? false,
      sourceAttribution: payload.sourceAttribution ?? null,
      user: payload.userId ? ({ id: payload.userId } as UserEntity) : null,
    } as DeepPartial<PrayerWallEntity>);
    return this.save(entity);
  }

  // ---------- Convenience getters ----------
  async getLatestPrayer() {
    return this.baseQB().orderBy('p.createdAt', 'DESC').limit(5).getMany();
  }

  async getActivePrayer() {
    return this.baseQB().orderBy('p.lastActivityAt', 'DESC').limit(5).getOne();
  }

  async getPrayerWithUser(prayerId: number) {
    return this.query('p')
      .leftJoinAndSelect('p.user', 'u')
      .where('p.id = :id', { id: prayerId })
      .getOne();
  }

  // ---------- Engagement / counts ----------
  async getEngagementCounts(prayerId: number, currentUserId?: number) {
    const [amenCount, commentCount, amenedByMe] = await Promise.all([
      this.amenRepo.count({ where: { prayer: { id: prayerId } } }),
      this.commentRepo.count({ where: { prayer: { id: prayerId } } }),
      currentUserId
        ? this.amenRepo.exists({
            where: { prayer: { id: prayerId }, user: { id: currentUserId } },
          })
        : Promise.resolve(false),
    ]);

    return {
      amenCount,
      commentCount,
      amenedByMe: !!amenedByMe,
    };
  }

  async incrementShareCount(prayerId: number) {
    try {
      await this.repository
        .createQueryBuilder()
        .update(PrayerWallEntity)
        .set({
          shareCount: () => '"shareCount" + 1',
          lastActivityAt: () => 'NOW()',
        })
        .where('id = :id', { id: prayerId })
        .execute();
      return true;
    } catch (e) {
      this.logger.error(e.stack);
      return false;
    }
  }

  async report(prayerId: number) {
    try {
      await this.repository
        .createQueryBuilder()
        .update(PrayerWallEntity)
        .set({
          reportedCount: () => '"reportedCount" + 1',
          lastActivityAt: () => 'NOW()',
        })
        .where('id = :id', { id: prayerId })
        .execute();
      return true;
    } catch (e) {
      this.logger.error(e.stack);
      return false;
    }
  }

  // ---------- Amen (idempotent) ----------
  async amenExists(prayerId: number, userId: number) {
    return this.amenRepo.exists({
      where: { prayer: { id: prayerId }, user: { id: userId } },
    });
  }

  async addAmen(
    prayerId: number,
    userId: number,
    reaction?: PrayerAmenReaction,
  ) {
    return this.repository.manager.transaction(async (m) => {
      const aRepo = m.getRepository(PrayerAmenEntity);
      const pRepo = m.getRepository(PrayerWallEntity);

      const exists = await aRepo.exists({
        where: { prayer: { id: prayerId } as any, user: { id: userId } as any },
      });
      if (exists) {
        // Optional: update reaction if provided
        if (reaction) {
          await aRepo
            .createQueryBuilder()
            .update(PrayerAmenEntity)
            .set({ reaction })
            .where('prayer_id = :pid AND user_id = :uid', {
              pid: prayerId,
              uid: userId,
            })
            .execute();
        }
        return true;
      }

      const amen = aRepo.create({
        prayer: { id: prayerId } as any,
        user: { id: userId } as any,
        reaction: reaction ?? PrayerAmenReaction.AMEN,
      });
      await aRepo.save(amen);

      await pRepo
        .createQueryBuilder()
        .update(PrayerWallEntity)
        .set({
          amenCount: () => '"amenCount" + 1',
          lastActivityAt: () => 'NOW()',
        })
        .where('id = :id', { id: prayerId })
        .execute();

      return true;
    });
  }

  async removeAmen(prayerId: number, userId: number) {
    return this.repository.manager.transaction(async (m) => {
      const aRepo = m.getRepository(PrayerAmenEntity);
      const pRepo = m.getRepository(PrayerWallEntity);

      const res = await aRepo.delete({
        prayer: { id: prayerId } as any,
        user: { id: userId } as any,
      });

      if (res.affected) {
        await pRepo
          .createQueryBuilder()
          .update(PrayerWallEntity)
          .set({
            amenCount: () => 'GREATEST("amenCount" - 1, 0)',
            lastActivityAt: () => 'NOW()',
          })
          .where('id = :id', { id: prayerId })
          .execute();
      }

      return !!res.affected;
    });
  }

  // ---------- Comments ----------
  async addComment(
    prayerId: number,
    userId: number,
    comment: string,
    parentCommentId?: number,
  ) {
    return this.repository.manager.transaction(async (m) => {
      const cRepo = m.getRepository(PrayerCommentEntity);
      const pRepo = m.getRepository(PrayerWallEntity);

      const data = {
        comment,
        prayer: { id: prayerId } as any,
        user: { id: userId } as any,
        parent: parentCommentId ? ({ id: parentCommentId } as any) : null,
      } satisfies DeepPartial<PrayerCommentEntity>;

      const entity = cRepo.create(data);
      const saved = await cRepo.save(entity);

      await pRepo
        .createQueryBuilder()
        .update(PrayerWallEntity)
        .set({
          commentCount: () => '"commentCount" + 1',
          lastActivityAt: () => 'NOW()',
        })
        .where('id = :id', { id: prayerId })
        .execute();

      return saved;
    });
  }

  async deleteComment(
    commentId: number,
    prayerId: number,
    where?: { userId?: number; isAdmin?: boolean },
  ) {
    return this.repository.manager.transaction(async (m) => {
      const cRepo = m.getRepository(PrayerCommentEntity);
      const pRepo = m.getRepository(PrayerWallEntity);

      if (!where?.isAdmin && where?.userId) {
        const own = await cRepo.findOne({
          where: { id: commentId, user: { id: where.userId } as any },
          relations: { user: true },
        });
        if (!own) return false;
      }

      const res = await cRepo.delete({ id: commentId } as any);
      if (res.affected) {
        await pRepo
          .createQueryBuilder()
          .update(PrayerWallEntity)
          .set({
            commentCount: () => 'GREATEST("commentCount" - 1, 0)',
            lastActivityAt: () => 'NOW()',
          })
          .where('id = :id', { id: prayerId })
          .execute();
      }
      return !!res.affected;
    });
  }

  async listCommentsPaginated(params: PrayerCommentSearchParams) {
    const page = Math.max(params.page || 1, 1);
    const limit = Math.max(params.pageSize || 20, 1);

    const qb = this.commentRepo
      .createQueryBuilder('c')
      .leftJoin('c.user', 'u')
      .select([
        'c.id AS id',
        'c.comment AS comment',
        'c.createdAt AS "createdAt"',
        `COALESCE(NULLIF(trim(concat_ws(' ', u.first_name, u.last_name)), ''), u."userName", '') AS "displayName"`,
        'u.id AS "userId"',
      ])
      // IMPORTANT: filter by prayer_id (bug fixed vs nugget version)
      .where('c.prayer_id = :pid', { pid: params.prayerId })
      .orderBy(`c.${params.orderBy || 'id'}`, params.orderDir || 'DESC');

    return paginateRaw(qb, { page, limit });
  }

  // ---------- Visibility / Answered ----------
  async setVisibility(prayerId: number, isVisible: boolean) {
    await this.repository
      .createQueryBuilder()
      .update(PrayerWallEntity)
      .set({ isVisible, lastActivityAt: () => 'NOW()' })
      .where('id = :id', { id: prayerId })
      .execute();
    return true;
  }

  async markAnswered(prayerId: number, answered: boolean) {
    await this.repository
      .createQueryBuilder()
      .update(PrayerWallEntity)
      .set({
        isAnswered: answered,
        answeredAt: answered ? () => 'NOW()' : null,
        lastActivityAt: () => 'NOW()',
      })
      .where('id = :id', { id: prayerId })
      .execute();
    return true;
  }
}
