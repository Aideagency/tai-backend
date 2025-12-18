// src/repository/courses/user-lesson-progress.repository.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BaseRepository } from '../base.repository';
import {
  UserLessonProgressEntity,
  LessonProgressStatus,
} from 'src/database/entities/user-lesson-progress.entity';
import { LessonEntity } from 'src/database/entities/lesson.entity';
import {
  UserCourseProgressEntity,
  CourseStatus,
} from 'src/database/entities/user-course-progress.entity';

@Injectable()
export class UserLessonProgressRepository extends BaseRepository<
  UserLessonProgressEntity,
  Repository<UserLessonProgressEntity>
> {
  protected logger = new Logger(UserLessonProgressRepository.name);

  constructor(
    @InjectRepository(UserLessonProgressEntity)
    repo: Repository<UserLessonProgressEntity>,
    @InjectRepository(LessonEntity)
    private readonly lessonRepo: Repository<LessonEntity>,
    @InjectRepository(UserCourseProgressEntity)
    private readonly courseProgRepo: Repository<UserCourseProgressEntity>,
    private readonly dataSource: DataSource,
  ) {
    super(repo);
  }

  async upsertProgress(args: {
    userId: string;
    courseProgressId: string;
    lessonId: string;
    status?: LessonProgressStatus;
    progressPercent?: number;
  }) {
    const lesson = await this.lessonRepo.findOne({
      where: { id: Number(args.lessonId) },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');

    return this.dataSource.transaction(async (manager) => {
      const existing = await manager.findOne(UserLessonProgressEntity, {
        where: {
          userId: args.userId,
          courseProgressId: args.courseProgressId,
          lessonId: args.lessonId,
        } as any,
      });

      const now = new Date();

      const row = existing
        ? manager.merge(UserLessonProgressEntity, existing, {
            status: args.status ?? existing.status,
            progressPercent:
              typeof args.progressPercent === 'number'
                ? args.progressPercent
                : existing.progressPercent,
            lastAccessedAt: now,
            startedAt: existing.startedAt ?? now,
            completedAt:
              args.status === LessonProgressStatus.COMPLETED
                ? (existing.completedAt ?? now)
                : existing.completedAt,
          })
        : manager.create(UserLessonProgressEntity, {
            user: { id: args.userId } as any,
            userId: args.userId,
            userCourseProgress: { id: args.courseProgressId } as any,
            courseProgressId: args.courseProgressId,
            lesson: { id: args.lessonId } as any,
            lessonId: args.lessonId,
            status: args.status ?? LessonProgressStatus.IN_PROGRESS,
            progressPercent: args.progressPercent ?? 0,
            startedAt: now,
            lastAccessedAt: now,
            completedAt:
              args.status === LessonProgressStatus.COMPLETED ? now : null,
          });

      const saved = await manager.save(UserLessonProgressEntity, row);

      // recompute course progress quickly
      const all = await manager.count(UserLessonProgressEntity, {
        where: { courseProgressId: args.courseProgressId } as any,
      });
      const done = await manager.count(UserLessonProgressEntity, {
        where: {
          courseProgressId: args.courseProgressId,
          status: LessonProgressStatus.COMPLETED,
        } as any,
      });

      const pct = all ? Math.round((done / all) * 100) : 0;

      await manager.update(
        UserCourseProgressEntity,
        { id: args.courseProgressId } as any,
        {
          progressPercent: pct,
          status:
            pct >= 100 ? CourseStatus.COMPLETED : CourseStatus.IN_PROGRESS,
          completedAt: pct >= 100 ? now : null,
          lastAccessedAt: now,
        },
      );

      return { lessonProgress: saved, courseProgressPercent: pct };
    });
  }
}
