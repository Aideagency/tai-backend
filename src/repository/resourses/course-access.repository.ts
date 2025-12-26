import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { BaseRepository } from '../base.repository';
import {
  CourseAccessEntity,
  AccessKind,
  AccessStatus,
} from 'src/database/entities/course-access.entity';
import { DeepPartial } from 'typeorm';

type CreateOrUpdateAccessArgs = {
  userId: number;
  courseId: number;
  kind: AccessKind;
  status?: AccessStatus;
  provider?: string | null;
  providerRef?: string | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
};

@Injectable()
export class CourseAccessRepository extends BaseRepository<
  CourseAccessEntity,
  Repository<CourseAccessEntity>
> {
  protected logger = new Logger(CourseAccessRepository.name);

  constructor(
    @InjectRepository(CourseAccessEntity)
    repo: Repository<CourseAccessEntity>,
  ) {
    super(repo);
  }

  /**
   * Returns the latest access row for a user+course (any status).
   */
  async findByUserAndCourse(
    userId: number,
    courseId: number,
  ): Promise<CourseAccessEntity | null> {
    return this.repository.findOne({
      where: { userId, courseId },
      order: { updatedAt: 'DESC' },
    });
  }

  async upsertAccess(
    args: CreateOrUpdateAccessArgs,
  ): Promise<CourseAccessEntity> {
    const existing = await this.findByUserAndCourse(args.userId, args.courseId);

    const payload: DeepPartial<CourseAccessEntity> = {
      ...(existing ?? {}),
      userId: args.userId,
      courseId: args.courseId,
      kind: args.kind,
      status: args.status ?? AccessStatus.ACTIVE,
      provider: args.provider ?? null,
      providerRef: args.providerRef ?? null,
      startsAt: args.startsAt ?? existing?.startsAt ?? new Date(),
      endsAt: args.endsAt ?? null,
    };

    const entity = this.repository.create(payload); // ✅ now TS picks the single-entity overload
    return this.repository.save(entity);
  }

  async hasActiveAccess(userId: number, courseId: number): Promise<boolean> {
    const now = new Date();

    const access = await this.repository.findOne({
      where: { userId, courseId, status: AccessStatus.ACTIVE },
    });

    if (!access) return false;
    if (access.endsAt && access.endsAt < now) return false;

    return true;
  }

  async listMyActiveCourseAccess(
    userId: number,
  ): Promise<CourseAccessEntity[]> {
    const now = new Date();

    const qb = this.repository.createQueryBuilder('ca');
    qb.where('ca.userId = :userId', { userId });
    qb.andWhere('ca.status = :status', { status: AccessStatus.ACTIVE });

    qb.andWhere(
      new Brackets((q) => {
        q.where('ca.endsAt IS NULL').orWhere('ca.endsAt >= :now', { now });
      }),
    );

    qb.orderBy('ca.updatedAt', 'DESC');

    return qb.getMany();
  }

  async findByProviderRefWithUserAndCourseSafe(args: {
    providerRef: string;
    provider?: string;
  }) {
    const qb = this.repository.createQueryBuilder('ca');

    qb.leftJoin('ca.course', 'c');
    qb.leftJoin('ca.user', 'u');

    qb.select([
      'ca.id',
      'ca.userId',
      'ca.courseId',
      'ca.kind',
      'ca.status',
      'ca.provider',
      'ca.providerRef',
      'ca.startsAt',
      'ca.endsAt',
      'ca.createdAt',
      'ca.updatedAt',

      'c.id',
      'c.title',
      'c.isFree',
      'c.price',
      'c.currency',
      'c.status',

      'u.id',
      'u.first_name',
      'u.last_name',
      'u.email_address',
    ]);

    qb.where('ca.providerRef = :providerRef', {
      providerRef: args.providerRef,
    });

    if (args.provider)
      qb.andWhere('ca.provider = :provider', { provider: args.provider });

    qb.orderBy('ca.updatedAt', 'DESC');

    const row = await qb.getOne();

    if (!row) {
      throw new NotFoundException(
        'Course access not found for the given provider reference',
      );
    }

    return row;
  }
}
