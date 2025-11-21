import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { BaseRepository } from '../base.repository';
import {
  ChallengeStatus,
  Visibility,
} from 'src/database/entities/challenge.entity';
import { CommunityTag as CommunityType } from 'src/database/entities/user.entity';
import { ChallengeTaskEntity } from 'src/database/entities/challenge-task.entity';

export interface ChallengeSearchParams {
  page?: number;
  pageSize?: number;

  // filters
  q?: string; // title/description/book
  community?: CommunityType;
  status?: ChallengeStatus;
  visibility?: Visibility;
  activeOnly?: boolean; // shorthand for status = ACTIVE

  // sorting
  orderBy?: 'createdAt' | 'id' | 'title' | 'durationDays';
  orderDir?: 'ASC' | 'DESC';
}

@Injectable()
export class ChallengeTaskRepository extends BaseRepository<
  ChallengeTaskEntity,
  Repository<ChallengeTaskEntity>
> {
  protected logger = new Logger(ChallengeTaskRepository.name);

  constructor(
    @InjectRepository(ChallengeTaskEntity)
    repository: Repository<ChallengeTaskEntity>,
  ) {
    super(repository);
  }

  /** Base query with common filters */
  private baseQB(
    params: ChallengeSearchParams = {},
  ): SelectQueryBuilder<ChallengeTaskEntity> {
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

    if (params.community) {
      qb.andWhere('c.community = :community', { community: params.community });
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

  /** Lightweight list optimized for the Today/Available cards */
  async listAvailableForCommunity(
    community: CommunityType,
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

  async deleteTaskById(taskId: number): Promise<void> {
    const result = await this.repository.delete({ id: taskId });

    if (!result.affected || result.affected === 0) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    this.logger.log(`Task ${taskId} deleted successfully`);
  }

  /**
   * Delete multiple tasks at once
   */
  async deleteManyTasks(taskIds: number[]): Promise<void> {
    if (!taskIds || taskIds.length === 0) return;

    const result = await this.repository.delete(taskIds);

    this.logger.log(
      `Deleted ${result.affected ?? 0} out of ${taskIds.length} task(s)`,
    );
  }

  async updateTaskById(
    taskId: number,
    updates: Partial<ChallengeTaskEntity>,
  ): Promise<ChallengeTaskEntity> {
    // Fetch task first to ensure it exists
    const task = await this.repository.findOne({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    // Merge only provided fields
    Object.assign(task, updates);

    // Save and return updated entity
    return await this.repository.save(task);
  }

  async findOneWithChallenge(taskId: number) {
    return this.repository.findOne({
      where: { id: taskId },
      relations: ['challenge'],
    });
  }
}
