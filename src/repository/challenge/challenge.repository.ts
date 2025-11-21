import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { BaseRepository } from '../base.repository';
import {
  ChallengeEntity,
  ChallengeStatus,
  Visibility,
} from 'src/database/entities/challenge.entity';
import { CommunityTag as CommunityType } from 'src/database/entities/user.entity';
import { UserChallengeEntity } from 'src/database/entities/user-challenge.entity';
import { UserTaskProgressEntity } from 'src/database/entities/user-task-progress.entity';

export interface ChallengeSearchParams {
  page?: number;
  pageSize?: number;

  // filters
  q?: string; // title/description/book
  community?: CommunityType | CommunityType[];
  status?: ChallengeStatus;
  visibility?: Visibility;
  activeOnly?: boolean; // shorthand for status = ACTIVE

  // sorting
  orderBy?: 'createdAt' | 'id' | 'title' | 'durationDays';
  orderDir?: 'ASC' | 'DESC';
}

@Injectable()
export class ChallengeRepository extends BaseRepository<
  ChallengeEntity,
  Repository<ChallengeEntity>
> {
  protected logger = new Logger(ChallengeRepository.name);

  constructor(
    @InjectRepository(ChallengeEntity) repository: Repository<ChallengeEntity>,
  ) {
    super(repository);
  }

  /** Base query with common filters */
  private baseQB(
    params: ChallengeSearchParams = {},
  ): SelectQueryBuilder<ChallengeEntity> {
    const qb = this.query('c');

    // Full-text-ish search
    if (params.q) {
      const q = `%${params.q.toLowerCase()}%`;
      qb.andWhere(
        `(LOWER(c.title) ILIKE :q
           OR LOWER(c.description) ILIKE :q
           OR LOWER(c.bookTitle) ILIKE :q
           OR LOWER(c.bookAuthor) ILIKE :q)`,
        { q },
      );
    }

    // if (params.community) {
    //   qb.andWhere('c.community = :community', { community: params.community });
    // }

    const communities: CommunityType[] = Array.isArray(params.community)
      ? params.community.filter(Boolean)
      : params.community
        ? [params.community]
        : [];

    // Only filter if the array has values; empty means "no filter"
    if (communities.length > 0) {
      qb.andWhere('c.community IN (:...communities)', { communities });
      // Postgres alternative: qb.andWhere('c.community = ANY(:communities)', { communities });
    }

    if (params.activeOnly) {
      qb.andWhere('c.status = :st', { st: ChallengeStatus.ACTIVE });
    } else if (params.status) {
      qb.andWhere('c.status = :st', { st: params.status });
    }

    if (params.visibility) {
      qb.andWhere('c.visibility = :vis', { vis: params.visibility });
    }

    // Sorting
    const orderBy = params.orderBy || 'id';
    const orderDir = params.orderDir || 'DESC';
    qb.orderBy(`c.${orderBy}`, orderDir);

    // Handy: map tasks count without joining all rows
    qb.loadRelationCountAndMap('c.tasksCount', 'c.tasks');

    return qb;
  }

  /** Paginated search for listing pages (e.g., “available challenges”) */
  async searchPaginated(params: ChallengeSearchParams) {
    const page = Math.max(params.page || 1, 1);
    const pageSize = Math.max(params.pageSize || 20, 1);
    const qb = this.baseQB(params);
    return this.paginate(
      { page, limit: pageSize },
      {}, // no additional where; it's in qb
      { id: 'DESC' }, // ignored when qb present
      {}, // relations
      qb,
    );
  }

  async listAvailableForCommunity(
    community: CommunityType[],
    opts: Omit<ChallengeSearchParams, 'community' | 'status' | 'activeOnly'> & {
      page?: number;
      pageSize?: number;
    } = {},
  ) {
    return this.searchPaginated({
      ...opts,
      community,
      activeOnly: true, // only ACTIVE for availability
      visibility: opts.visibility, // optional override
    });
  }

  async listAllChallenges(opts: ChallengeSearchParams = {}) {
    const page = Math.max(opts.page || 1, 1);
    const pageSize = Math.max(opts.pageSize || 20, 1);

    return this.searchPaginated({
      ...opts,
      page,
      pageSize,
    });
  }

  /** Find ACTIVE challenge by id (or undefined if not active) */
  async findActiveById(id: number): Promise<ChallengeEntity | undefined> {
    return this.query('c')
      .where('c.id = :id', { id })
      .andWhere('c.status = :st', { st: ChallengeStatus.ACTIVE })
      .getOne();
  }

  /** Find by id regardless of status (throwing is caller’s job) */
  async findById(id: number): Promise<ChallengeEntity | undefined> {
    return this.findOne({ id });
  }

  /** Detail view for users: challenge + tasks count; optionally include tasks */
  async getDetailForUser(challengeId: number, withTasks = false) {
    const qb = this.query('c')
      .where('c.id = :id', { id: challengeId })
      .loadRelationCountAndMap('c.tasksCount', 'c.tasks');

    if (withTasks) {
      qb.leftJoinAndSelect('c.tasks', 't')
        .addOrderBy('t.weekNumber', 'ASC', 'NULLS FIRST')
        .addOrderBy('t.dayNumber', 'ASC');
    }

    return qb.getOne();
  }

  /** Convenience: list by ids preserving filters (useful for “me/active” decorators if you need metadata) */
  async findByIdsFiltered(
    ids: number[],
    params: Partial<ChallengeSearchParams> = {},
  ) {
    if (!ids?.length) return [];
    const qb = this.baseQB(params as ChallengeSearchParams).andWhere(
      'c.id IN (:...ids)',
      { ids },
    );
    return qb.getMany();
  }

  async findByIdWithDetails(
    id: number,
    opts: {
      withTasks?: boolean;
      withTaskItems?: boolean; // if your Task has items/steps
      withCreator?: boolean; // if Challenge has creator relation
      withCommunity?: boolean; // if you want community info
      onlyActive?: boolean; // gate by ACTIVE status
    } = {},
  ): Promise<ChallengeEntity | undefined> {
    const {
      withTasks = true,
      withTaskItems = false,
      withCreator = false,
      withCommunity = false,
      onlyActive = false,
    } = opts;

    // base
    const qb = this.query('c')
      .where('c.id = :id', { id })
      // still fine to use for tasksCount (this relation exists)
      .loadRelationCountAndMap('c.tasksCount', 'c.tasks');

    if (onlyActive) {
      qb.andWhere('c.status = :st', { st: ChallengeStatus.ACTIVE });
    }

    if (withCreator) {
      qb.leftJoinAndSelect('c.creator', 'creator'); // adapt if different
    }

    if (withCommunity) {
      qb.leftJoinAndSelect('c.community', 'community'); // adapt if different
    }

    if (withTasks) {
      qb.leftJoinAndSelect('c.tasks', 't')
        .addOrderBy('t.weekNumber', 'ASC', 'NULLS FIRST')
        .addOrderBy('t.dayNumber', 'ASC')
        .addOrderBy('t.id', 'ASC');

      if (withTaskItems) {
        qb.leftJoinAndSelect('t.items', 'ti') // adapt to your schema
          .addOrderBy('ti.order', 'ASC', 'NULLS FIRST')
          .addOrderBy('ti.id', 'ASC');
      }
    }

    // ---- participantsCount via subquery (no relation needed) ----
    // SELECT COUNT(uc.id) FROM UserChallenges uc WHERE uc.challengeId = c.id
    qb.addSelect(
      (sub) =>
        sub
          .select('COUNT(uc.id)', 'participantsCount')
          .from(UserChallengeEntity, 'uc')
          .where('uc.challengeId = c.id'),
      'participantsCount',
    );

    // We need raw row to read the alias; then attach it to the entity
    const { entities, raw } = await qb.getRawAndEntities();
    const entity = entities[0];
    if (!entity) return undefined;

    // raw alias key is exactly what we provided: 'participantsCount'
    const participantsCountRaw = raw?.[0]?.['participantsCount'];
    (entity as any).participantsCount =
      participantsCountRaw != null ? Number(participantsCountRaw) : 0;

    return entity;
  }

  async listCombinedForUser(
    userId: number,
    params: ChallengeSearchParams & { prioritizeEnrolled?: boolean } = {},
  ) {
    const page = Math.max(params.page || 1, 1);
    const pageSize = Math.max(params.pageSize || 20, 1);

    const qb = this.baseQB(params); // selects 'c' + tasksCount etc.

    // Join user enrollments without needing a ChallengeEntity relation
    qb.leftJoin(
      UserChallengeEntity,
      'uc',
      'uc.challengeId = c.id AND uc.userId = :userId AND uc.isArchived = false',
      { userId },
    );

    // tasksCompleted subquery bound to uc.id
    qb.addSelect(
      (sub) =>
        sub
          .select('COUNT(p.id)')
          .from(UserTaskProgressEntity, 'p')
          .where('p.userChallengeId = uc.id')
          .andWhere('p.completedByUser = true'),
      'tasksCompleted',
    );

    // Select computed user fields
    qb.addSelect('uc.id', 'userChallengeId')
      .addSelect('uc.progressPercent', 'progressPercent')
      .addSelect('uc.isCompleted', 'isCompleted')
      .addSelect('uc.startDate', 'startDate')
      .addSelect('uc.endDate', 'endDate')
      .addSelect(
        `CASE WHEN uc.id IS NULL THEN false ELSE true END`,
        'enrolled',
      );

    if (params.prioritizeEnrolled) {
      qb.addOrderBy('CASE WHEN uc.id IS NULL THEN 0 ELSE 1 END', 'DESC');
    }

    // paginate using your BaseRepository helper
    const pageResult = await this.paginate(
      { page, limit: pageSize },
      {},
      { id: 'DESC' },
      {},
      qb,
    );

    // Map raw computed columns back onto the items
    const { raw } = await qb.getRawAndEntities();
    const extras = new Map<number, any>();
    for (const r of raw) {
      const challengeId = Number(r['c_id']); // default alias for c.id
      extras.set(challengeId, {
        enrolled:
          r['enrolled'] === true ||
          r['enrolled'] === 'true' ||
          r['enrolled'] === 1,
        userChallengeId: r['userChallengeId']
          ? Number(r['userChallengeId'])
          : null,
        progressPercent:
          r['progressPercent'] != null ? Number(r['progressPercent']) : null,
        isCompleted: r['isCompleted'] ?? null,
        startDate: r['startDate'] ?? null,
        endDate: r['endDate'] ?? null,
        tasksCompleted:
          r['tasksCompleted'] != null ? Number(r['tasksCompleted']) : 0,
      });
    }

    const mappedItems = pageResult.items.map((ch: any) => ({
      ...ch,
      ...(extras.get(ch.id) ?? {
        enrolled: false,
        userChallengeId: null,
        progressPercent: null,
        isCompleted: null,
        startDate: null,
        endDate: null,
        tasksCompleted: 0,
      }),
    }));

    return { ...pageResult, items: mappedItems };
  }

  async deleteById(id: number): Promise<void> {
    const result = await this.repository.delete({ id });

    if (!result.affected || result.affected === 0) {
      throw new NotFoundException('Challenge not found');
    }

    this.logger.log(`Challenge ${id} deleted successfully`);
  }
}
