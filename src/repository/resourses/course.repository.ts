// course.repository.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike } from 'typeorm';
import {
  CourseEntity,
  PublishStatus,
} from 'src/database/entities/course.entity';
import { BaseRepository } from '../base.repository';

export type CourseListFilters = {
  q?: string; // search by title
  status?: PublishStatus;
  page?: number;
  pageSize?: number;
  orderBy?: 'createdAt' | 'updatedAt' | 'id' | 'title';
  orderDir?: 'ASC' | 'DESC';
};

@Injectable()
export class CourseRepository extends BaseRepository<
  CourseEntity,
  Repository<CourseEntity>
> {
  protected logger = new Logger(CourseRepository.name);
  protected repo: Repository<CourseEntity>;

  constructor(@InjectRepository(CourseEntity) repo: Repository<CourseEntity>) {
    super(repo);
    this.repo = repo;
  }

  async createCourse(payload: Partial<CourseEntity>): Promise<CourseEntity> {
    // IMPORTANT: no slug generation here anymore
    const entity = this.repo.create({
      title: payload.title?.trim(),
      descriptionHtml: payload.descriptionHtml ?? null,
      thumbnailUrl: payload.thumbnailUrl ?? null,
      thumbnailPublicId: payload.thumbnailPublicId ?? null,
      thumbnailResourceType: payload.thumbnailResourceType ?? null,
      isFree: payload.isFree ?? true,
      price: payload.price ?? null,
      currency: payload.currency ?? 'NGN',
      status: payload.status ?? PublishStatus.DRAFT,
    });

    return this.repo.save(entity);
  }

  async updateCourse(
    id: number,
    payload: Partial<CourseEntity>,
  ): Promise<CourseEntity> {
    const existing = await this.getById(id);

    // IMPORTANT: no slug updates here anymore
    const merged = this.repo.merge(existing, {
      ...(payload.title !== undefined ? { title: payload.title?.trim() } : {}),
      ...(payload.descriptionHtml !== undefined
        ? { descriptionHtml: payload.descriptionHtml }
        : {}),
      ...(payload.thumbnailUrl !== undefined
        ? { thumbnailUrl: payload.thumbnailUrl }
        : {}),
      ...(payload.thumbnailPublicId !== undefined
        ? { thumbnailPublicId: payload.thumbnailPublicId }
        : {}),
      ...(payload.thumbnailResourceType !== undefined
        ? { thumbnailResourceType: payload.thumbnailResourceType }
        : {}),
      ...(payload.isFree !== undefined ? { isFree: payload.isFree } : {}),
      ...(payload.price !== undefined ? { price: payload.price } : {}),
      ...(payload.currency !== undefined ? { currency: payload.currency } : {}),
      ...(payload.status !== undefined ? { status: payload.status } : {}),
    });

    return this.repo.save(merged);
  }

  async getById(id: number): Promise<CourseEntity> {
    // You fetch by id only now
    const course = await this.repo.findOne({ where: { id } });
    if (!course) {
      // Keep it simple; you can throw NotFoundException from service if you prefer
      throw new Error(`Course not found (id=${id})`);
    }
    return course;
  }

  async deleteById(id: number): Promise<void> {
    await this.repo.delete({ id });
  }

  async list(filters: CourseListFilters = {}) {
    const page = Number(filters.page ?? 1);
    const pageSize = Number(filters.pageSize ?? 20);

    const orderBy = filters.orderBy ?? 'createdAt';
    const orderDir = filters.orderDir ?? 'DESC';

    const where: FindOptionsWhere<CourseEntity> = {};

    if (filters.status) where.status = filters.status;

    if (filters.q && filters.q.trim()) {
      // TypeORM doesn't allow mixing plain where easily without array;
      // we use query builder for flexible search
      const qb = this.repo.createQueryBuilder('c');

      qb.where('1=1');

      if (filters.status) {
        qb.andWhere('c.status = :status', { status: filters.status });
      }

      qb.andWhere('LOWER(c.title) LIKE :q', {
        q: `%${filters.q.toLowerCase().trim()}%`,
      });

      qb.orderBy(`c.${orderBy}`, orderDir as 'ASC' | 'DESC');

      qb.skip((page - 1) * pageSize).take(pageSize);

      const [items, totalItems] = await qb.getManyAndCount();

      return {
        items,
        meta: {
          totalItems,
          itemsPerPage: pageSize,
          currentPage: page,
          totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
        },
      };
    }

    // No search term -> simple findAndCount
    const [items, totalItems] = await this.repo.findAndCount({
      where,
      order: { [orderBy]: orderDir },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      items,
      meta: {
        totalItems,
        itemsPerPage: pageSize,
        currentPage: page,
        totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
      },
    };
  }

  async existsByTitle(title: string, excludeId?: number): Promise<boolean> {
    const qb = this.repo
      .createQueryBuilder('c')
      .select('c.id')
      .where('LOWER(c.title) = :t', { t: title.trim().toLowerCase() })
      .limit(1);

    if (excludeId) qb.andWhere('c.id != :excludeId', { excludeId });

    const row = await qb.getOne();
    return !!row;
  }

  async listForUser(
    userId: number,
    filters: CourseListFilters = {},
  ): Promise<{
    items: Array<CourseEntity & { isEnrolled: boolean; isActive: boolean }>;
    meta: {
      totalItems: number;
      itemsPerPage: number;
      currentPage: number;
      totalPages: number;
    };
  }> {
    const page = Number(filters.page ?? 1);
    const pageSize = Number(filters.pageSize ?? 20);
    const orderBy = filters.orderBy ?? 'createdAt';
    const orderDir = (filters.orderDir ?? 'DESC') as 'ASC' | 'DESC';

    const now = new Date();

    const qb = this.repo.createQueryBuilder('c');

    // filters
    if (filters.status)
      qb.andWhere('c.status = :status', { status: filters.status });

    if (filters.q && filters.q.trim()) {
      qb.andWhere('LOWER(c.title) LIKE :q', {
        q: `%${filters.q.toLowerCase().trim()}%`,
      });
    }

    // ✅ isEnrolled = any course_access row exists for user+course
    qb.addSelect(
      `EXISTS(
        SELECT 1
        FROM course_access ca
        WHERE ca.course_id = c.id
          AND ca.user_id = :userId
      )`,
      'isEnrolled',
    );

    // ✅ isActive = ACTIVE access and not expired
    qb.addSelect(
      `EXISTS(
        SELECT 1
        FROM course_access ca2
        WHERE ca2.course_id = c.id
          AND ca2.user_id = :userId
          AND ca2.status = 'ACTIVE'
          AND (ca2.endsAt IS NULL OR ca2.endsAt >= :now)
      )`,
      'isActive',
    );

    qb.setParameters({ userId, now });

    qb.orderBy(`c.${orderBy}`, orderDir);

    qb.skip((page - 1) * pageSize).take(pageSize);

    const [entities, totalItems] = await qb.getManyAndCount();
    const raw = await qb.getRawMany(); // contains isEnrolled/isActive columns

    // map flags back onto entities (same order)
    const items = entities.map((course, idx) => ({
      ...course,
      isEnrolled: raw[idx]?.isEnrolled === true || raw[idx]?.isEnrolled === 't',
      isActive: raw[idx]?.isActive === true || raw[idx]?.isActive === 't',
    }));

    return {
      items,
      meta: {
        totalItems,
        itemsPerPage: pageSize,
        currentPage: page,
        totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
      },
    };
  }

  // -----------------------------
  // NEW: full course payload for a user with flags (+ lessons + attachments + stats)
  // -----------------------------
  async getFullCourseForUser(
    courseId: number,
    userId: number,
  ): Promise<{
    course: CourseEntity;
    isEnrolled: boolean;
    isActive: boolean;
    stats: { lessonCount: number; attachmentCount: number };
  }> {
    const now = new Date();

    // Pull course + lessons + attachments (ordered)
    const qb = this.repo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.lessons', 'l')
      .leftJoinAndSelect('l.attachments', 'a')
      .where('c.id = :courseId', { courseId })
      .orderBy('l.sortOrder', 'ASC')
      .addOrderBy('l.id', 'ASC')
      .addOrderBy('a.id', 'ASC');

    // flags (same EXISTS approach)
    qb.addSelect(
      `EXISTS(
        SELECT 1
        FROM course_access ca
        WHERE ca.course_id = c.id
          AND ca.user_id = :userId
      )`,
      'isEnrolled',
    );

    qb.addSelect(
      `EXISTS(
        SELECT 1
        FROM course_access ca2
        WHERE ca2.course_id = c.id
          AND ca2.user_id = :userId
          AND ca2.status = 'ACTIVE'
          AND (ca2.endsAt IS NULL OR ca2.endsAt >= :now)
      )`,
      'isActive',
    );

    qb.setParameters({ userId, now });

    const { entities, raw } = await qb.getRawAndEntities();

    const course = entities?.[0];
    if (!course) {
      throw new Error(`Course not found (id=${courseId})`);
    }

    const isEnrolled =
      raw?.[0]?.isEnrolled === true || raw?.[0]?.isEnrolled === 't';
    const isActive = raw?.[0]?.isActive === true || raw?.[0]?.isActive === 't';

    // stats (safe from join duplication)
    const lessonCount = course.lessons?.length ?? 0;
    const attachmentCount =
      course.lessons?.reduce(
        (sum, lesson) => sum + (lesson.attachments?.length ?? 0),
        0,
      ) ?? 0;

    return {
      course,
      isEnrolled,
      isActive,
      stats: { lessonCount, attachmentCount },
    };
  }
}
