// src/repository/resourses/lesson-section.repository.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../base.repository';
import { LessonSectionEntity } from 'src/database/entities/lesson-section.entity';

@Injectable()
export class LessonSectionRepository extends BaseRepository<
  LessonSectionEntity,
  Repository<LessonSectionEntity>
> {
  protected logger = new Logger(LessonSectionRepository.name);

  constructor(
    @InjectRepository(LessonSectionEntity)
    repo: Repository<LessonSectionEntity>,
  ) {
    super(repo);
  }

  async listForLesson(lessonId: number) {
    return this.repository.find({
      where: { lessonId } as any,
      order: { sortOrder: 'ASC' } as any,
    });
  }

  async findOneForLesson(lessonId: number, sectionId: number) {
    return this.repository.findOne({
      where: { id: sectionId, lessonId } as any,
    });
  }
}
