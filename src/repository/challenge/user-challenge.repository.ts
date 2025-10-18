import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, DataSource } from 'typeorm';
import { BaseRepository } from '../base.repository';
import { UserChallengeEntity } from 'src/database/entities/user-challenge.entity';
import { UserTaskProgressEntity } from 'src/database/entities/user-task-progress.entity';
import {
  ChallengeEntity,
  ChallengeStatus,
} from 'src/database/entities/challenge.entity';
import { ChallengeTaskEntity } from 'src/database/entities/challenge-task.entity';

export interface EnrollmentSearchParams {
  page?: number;
  pageSize?: number;
  archived?: boolean; // false = active, true = archived
  orderBy?: 'createdAt' | 'id' | 'startDate' | 'progressPercent';
  orderDir?: 'ASC' | 'DESC';
}

@Injectable()
export class UserChallengesRepository extends BaseRepository<
  UserChallengeEntity,
  Repository<UserChallengeEntity>
> {
  protected logger = new Logger(UserChallengesRepository.name);

  constructor(
    @InjectRepository(UserChallengeEntity)
    repo: Repository<UserChallengeEntity>,
    @InjectRepository(UserTaskProgressEntity)
    private readonly progressRepo: Repository<UserTaskProgressEntity>,
    @InjectRepository(ChallengeEntity)
    private readonly challengeRepo: Repository<ChallengeEntity>,
    @InjectRepository(ChallengeTaskEntity)
    private readonly taskRepo: Repository<ChallengeTaskEntity>,
    private readonly dataSource: DataSource,
  ) {
    super(repo);
  }

  /** QB helper scoped to a user */
  private baseQB(userId: number): SelectQueryBuilder<UserChallengeEntity> {
    return this.query('uc')
      .leftJoinAndSelect('uc.challenge', 'c')
      .where('uc.user.id = :userId', { userId }); // Corrected to use user.id
  }

  /** Paginated list for active/archived enrollments */
  async listForUser(userId: number, params: EnrollmentSearchParams) {
    const page = Math.max(params.page || 1, 1);
    const pageSize = Math.max(params.pageSize || 20, 1);

    const qb = this.baseQB(userId);

    if (typeof params.archived === 'boolean') {
      qb.andWhere('uc.isArchived = :arch', { arch: params.archived });
    }

    const orderBy = params.orderBy || 'id';
    const orderDir = params.orderDir || 'DESC';
    qb.orderBy(`uc.${orderBy}`, orderDir);

    // quick counters for cards
    qb.loadRelationCountAndMap('uc.tasksTotal', 'uc.progress');
    qb.loadRelationCountAndMap('uc.tasksCompleted', 'uc.progress', 'p', (q) =>
      q.andWhere('p.completedByUser = true'),
    );

    return this.paginate({ page, limit: pageSize }, {}, { id: 'DESC' }, {}, qb);
  }

  /** Get a single enrollment owned by user (throws if not found / not owner) */
  async getOwnedEnrollmentOrFail(userId: number, userChallengeId: number) {
    const uc = await this.query('uc')
      .leftJoinAndSelect('uc.challenge', 'c')
      .where('uc.id = :id', { id: userChallengeId })
      .andWhere('uc.user.id = :userId', { userId }) // Corrected to use user.id
      .getOne();

    if (!uc) throw new NotFoundException('Enrollment not found');
    return uc;
  }

  /**
   * Enroll a user to a challenge.
   * - Validates challenge ACTIVE
   * - Creates UserChallenge
   * - Pre-creates UserTaskProgress rows for all tasks in challenge
   */
  async enroll(userId: number, challengeId: number, startDate?: Date) {
    const challenge = await this.challengeRepo.findOne({
      where: { id: challengeId },
    });
    if (!challenge || challenge.status !== ChallengeStatus.ACTIVE) {
      throw new NotFoundException('Challenge not available');
    }

    // Prevent duplicate enrollment
    const existing = await this.repository.findOne({
      where: {
        user: { id: userId }, // Correct relation for user
        challenge: { id: challengeId },
        isArchived: false,
      },
      relations: ['challenge'],
    });
    if (existing) return existing; // idempotent behavior

    const tasks = await this.taskRepo.find({
      where: { challenge: { id: challengeId } },
      order: { weekNumber: 'ASC', dayNumber: 'ASC' },
    });

    return await this.dataSource.transaction(async (manager) => {
      const uc = manager.create(UserChallengeEntity, {
        user: { id: userId } as any, // Correct relation for user
        challenge: { id: challengeId } as any, // Correct relation for challenge
        startDate: startDate ?? new Date(),
        isCompleted: false,
        isArchived: false,
        progressPercent: 0,
        streakCount: 0,
        lastCheckInAt: null,
      });

      const savedUC = await manager.save(UserChallengeEntity, uc);

      // Pre-create progress rows
      const progressRows = tasks.map((t) =>
        manager.create(UserTaskProgressEntity, {
          userChallenge: { id: savedUC.id } as any,
          task: { id: t.id } as any,
          completedByUser: false,
          confirmedByPartner: false,
          completedAt: null,
          confirmedAt: null,
          partnerUserId: null,
        }),
      );
      if (progressRows.length) {
        await manager.save(UserTaskProgressEntity, progressRows);
      }

      return savedUC;
    });
  }

  /**
   * Today’s tasks for an enrollment.
   * Computes dayIndex from startDate.
   */
  async getTodayTasks(
    userId: number,
    userChallengeId: number,
    now = new Date(),
  ) {
    const uc = await this.getOwnedEnrollmentOrFail(userId, userChallengeId);
    if (!uc.startDate) throw new ForbiddenException('Enrollment not started');

    // dayIndex: 1..durationDays
    const msPerDay = 24 * 60 * 60 * 1000;
    const dayIndex =
      Math.floor(
        (this.midnightUTC(now).getTime() -
          this.midnightUTC(uc.startDate).getTime()) /
          msPerDay,
      ) + 1;

    // clamp to duration
    const duration = uc.challenge.durationDays;
    if (dayIndex < 1 || dayIndex > duration) {
      return { dayIndex, tasks: [] };
    }

    // find tasks scheduled for this day (daily tasks usually match dayNumber; weekly by weekNumber if you choose)
    const tasksForDay = await this.progressRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.task', 't')
      .where('p.userChallenge.id = :ucId', { ucId: uc.id }) // Corrected reference to userChallenge.id
      .andWhere('(t.dayNumber = :dayIndex OR t.dayNumber IS NULL)', {
        dayIndex,
      })
      .orderBy('t.weekNumber', 'ASC', 'NULLS FIRST')
      .addOrderBy('t.dayNumber', 'ASC')
      .getMany();

    return { dayIndex, tasks: tasksForDay };
  }

  /** Toggle task completion; then recompute streak & progress, return fresh snapshot */
  async toggleTaskCompletion(
    userId: number,
    userChallengeId: number,
    taskId: number,
    completed: boolean,
  ) {
    const uc = await this.getOwnedEnrollmentOrFail(userId, userChallengeId);

    // Check task belongs to this challenge
    const task = await this.taskRepo.findOne({
      where: { id: taskId, challenge: { id: uc.challenge.id } },
    });
    if (!task) throw new NotFoundException('Task not found in this challenge');

    await this.progressRepo.update(
      { userChallenge: { id: uc.id }, task: { id: taskId } } as any,
      {
        completedByUser: completed,
        completedAt: completed ? new Date() : null,
      },
    );

    await this.recomputeSnapshot(uc.id);
    return this.getSnapshot(uc.id);
  }

  /** Partner confirmation toggle */
  async partnerConfirm(
    userId: number,
    userChallengeId: number,
    taskId: number,
    confirmed: boolean,
    partnerUserId?: number,
  ) {
    const uc = await this.getOwnedEnrollmentOrFail(userId, userChallengeId);

    // Only meaningful if requireDualConfirmation on challenge
    if (!uc.challenge.requireDualConfirmation) {
      throw new ForbiddenException(
        'Dual confirmation not required for this challenge',
      );
    }

    await this.progressRepo.update(
      { userChallenge: { id: uc.id }, task: { id: taskId } } as any,
      {
        confirmedByPartner: confirmed,
        confirmedAt: confirmed ? new Date() : null,
        partnerUserId: confirmed
          ? partnerUserId !== undefined && partnerUserId !== null
            ? String(partnerUserId)
            : null
          : null,
      },
    );

    await this.recomputeSnapshot(uc.id);
    return this.getSnapshot(uc.id);
  }

  /** Manually mark as completed (service may auto-call when all tasks done) */
  async markCompleted(userId: number, userChallengeId: number) {
    const uc = await this.getOwnedEnrollmentOrFail(userId, userChallengeId);
    await this.repository.update(
      { id: uc.id },
      { isCompleted: true, endDate: new Date() },
    );
    return this.getSnapshot(uc.id);
  }

  /** Archive enrollment */
  async archive(userId: number, userChallengeId: number) {
    const uc = await this.getOwnedEnrollmentOrFail(userId, userChallengeId);
    await this.repository.update({ id: uc.id }, { isArchived: true });
    return true;
  }

  /** Snapshot for Today card (progress %, streak, totals) */
  async getSnapshot(userChallengeId: number) {
    const uc = await this.query('uc')
      .leftJoinAndSelect('uc.challenge', 'c')
      .where('uc.id = :id', { id: userChallengeId })
      .getOne();

    if (!uc) throw new NotFoundException('Enrollment not found');

    const [totals, completed] = await Promise.all([
      this.progressRepo.count({
        where: { userChallenge: { id: uc.id } as any },
      }),
      this.progressRepo.count({
        where: { userChallenge: { id: uc.id } as any, completedByUser: true },
      }),
    ]);

    return {
      id: uc.id,
      challengeId: uc.challenge.id,
      title: uc.challenge.title,
      progressPercent: uc.progressPercent,
      streakCount: uc.streakCount,
      lastCheckInAt: uc.lastCheckInAt,
      totals: { tasks: totals, completed },
      isCompleted: uc.isCompleted,
      isArchived: uc.isArchived,
      startDate: uc.startDate,
      endDate: uc.endDate,
      durationDays: uc.challenge.durationDays,
      requireDualConfirmation: uc.challenge.requireDualConfirmation,
    };
  }

  /**
   * Recompute progress %, streak, lastCheckIn.
   * Streak logic (simple daily): increments if today completed; resets on gaps.
   * Adjust to your exact business rule as needed.
   */
  async recomputeSnapshot(userChallengeId: number) {
    const uc = await this.repository.findOne({
      where: { id: userChallengeId },
      relations: ['challenge'],
    });
    if (!uc) return;

    const progressRows = await this.progressRepo.find({
      where: { userChallenge: { id: uc.id } as any },
      relations: ['task'],
      order: { completedAt: 'ASC' },
    });

    const total = progressRows.length || 1;
    const completedCount = progressRows.filter((p) => p.completedByUser).length;

    // streak: count of consecutive recent days completed (based on dayNumber)
    const completedDays = new Set<number>();
    for (const p of progressRows) {
      if (p.completedByUser && p.task?.dayNumber) {
        completedDays.add(p.task.dayNumber);
      }
    }
    let streak = 0;
    const todayDayIndex = this.dayIndexFromStart(uc.startDate, new Date());
    for (let d = todayDayIndex; d >= 1; d--) {
      if (completedDays.has(d)) streak++;
      else break;
    }

    const lastCheckInAt =
      progressRows
        .filter((p) => p.completedAt)
        .sort(
          (a, b) =>
            (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0),
        )[0]?.completedAt || null;

    await this.repository.update(
      { id: uc.id },
      {
        progressPercent: Math.round((completedCount / total) * 100),
        streakCount: streak,
        lastCheckInAt,
        isCompleted:
          completedCount === total && total > 0 ? true : uc.isCompleted,
        endDate:
          completedCount === total && total > 0
            ? (uc.endDate ?? new Date())
            : uc.endDate,
      },
    );
  }

  /** Utility: compute day index (1-based) from start */
  private dayIndexFromStart(start: Date | null, now: Date) {
    if (!start) return 1;
    const ms =
      this.midnightUTC(now).getTime() - this.midnightUTC(start).getTime();
    return Math.floor(ms / (24 * 60 * 60 * 1000)) + 1;
  }

  private midnightUTC(d: Date) {
    return new Date(
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
    );
  }
}
