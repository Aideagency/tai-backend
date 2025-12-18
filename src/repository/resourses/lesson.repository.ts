// src/repository/courses/lesson.repository.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../base.repository';
import {
  LessonEntity,
  LessonStatus,
} from 'src/database/entities/lesson.entity';

@Injectable()
export class LessonRepository extends BaseRepository<
  LessonEntity,
  Repository<LessonEntity>
> {
  protected logger = new Logger(LessonRepository.name);

  constructor(@InjectRepository(LessonEntity) repo: Repository<LessonEntity>) {
    super(repo);
  }

  async listForCourse(courseId: string) {
    return this.repository.find({
      where: { course: { id: courseId } as any },
      order: { sortOrder: 'ASC' },
    });
  }

  async listActiveForCourse(courseId: string) {
    return this.repository.find({
      where: {
        course: { id: courseId } as any,
        status: LessonStatus.ACTIVE,
      },
      order: { sortOrder: 'ASC' },
    });
  }

  async findByZohoLessonId(courseId: string, zohoLessonId: string) {
    return this.repository.findOne({
      where: { course: { id: courseId } as any, zohoLessonId } as any,
    });
  }
}
