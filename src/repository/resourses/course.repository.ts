// src/repository/courses/course.repository.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, In } from 'typeorm';
import { BaseRepository } from '../base.repository';
import {
  CourseEntity,
  CourseAccessType,
} from 'src/database/entities/course.entity';

export interface CourseListParams {
  page?: number;
  pageSize?: number;
  q?: string;
  accessType?: CourseAccessType;
  publishedOnly?: boolean;
  orderBy?: 'createdAt' | 'updatedAt' | 'title' | 'id';
  orderDir?: 'ASC' | 'DESC';
}

@Injectable()
export class CourseRepository extends BaseRepository<
  CourseEntity,
  Repository<CourseEntity>
> {
  protected logger = new Logger(CourseRepository.name);

  constructor(@InjectRepository(CourseEntity) repo: Repository<CourseEntity>) {
    super(repo);
  }

  qb(params: CourseListParams): SelectQueryBuilder<CourseEntity> {
    const qb = this.query('c');

    if (params.q) {
      const q = `%${params.q.toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(c.title) ILIKE :q OR LOWER(c.description) ILIKE :q)',
        { q },
      );
    }
    if (params.accessType)
      qb.andWhere('c.accessType = :a', { a: params.accessType });
    if (params.publishedOnly) qb.andWhere('c.isPublished = true');

    // qb.leftJoinAndSelect('c.lessons', 'l'); // optional; remove if too heavy
    qb.orderBy(`c.${params.orderBy || 'id'}`, params.orderDir || 'DESC');

    return qb;
  }

  async listPaginated(params: CourseListParams) {
    const page = Math.max(params.page || 1, 1);
    const pageSize = Math.max(params.pageSize || 20, 1);

    const qb = this.qb(params);
    return this.paginate({ page, limit: pageSize }, {}, { id: 'DESC' }, {}, qb);
  }

  async findByZohoCourseId(zoho_course_id: string) {
    return this.findOne({ zoho_course_id });
  }

  async findByZohoCourseIds(ids: string[]) {
    if (!ids.length) return [];
    return this.repository.find({ where: { zoho_course_id: In(ids) } });
  }

  async findOneWithDetails(courseId: number) {
    return this.query('c')
      .leftJoinAndSelect('c.lessons', 'l', 'l.status = :active', {
        active: 'ACTIVE',
      })
      .where('c.id = :id', { id: courseId })
      .orderBy('l.sortOrder', 'ASC')
      .getOne();
  }
}
