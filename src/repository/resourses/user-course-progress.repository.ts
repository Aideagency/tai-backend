// src/repository/courses/user-course-progress.repository.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BaseRepository } from '../base.repository';
import {
  UserCourseProgressEntity,
  CourseStatus,
} from 'src/database/entities/user-course-progress.entity';
import { CourseEntity } from 'src/database/entities/course.entity';

@Injectable()
export class UserCourseProgressRepository extends BaseRepository<
  UserCourseProgressEntity,
  Repository<UserCourseProgressEntity>
> {
  protected logger = new Logger(UserCourseProgressRepository.name);

  constructor(
    @InjectRepository(UserCourseProgressEntity)
    repo: Repository<UserCourseProgressEntity>,
    @InjectRepository(CourseEntity)
    private readonly courseRepo: Repository<CourseEntity>,
    private readonly dataSource: DataSource,
  ) {
    super(repo);
  }

  async getForUserCourse(userId: number, courseId: number) {
    return this.repository.findOne({
      where: { userId, courseId },
      relations: ['course', 'lessonProgress'],
    });
  }

  async enrollIfNotExists(userId: number, courseId: number) {
    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    const existing = await this.repository.findOne({
      where: { userId, courseId },
    });
    if (existing) return existing;

    return this.dataSource.transaction(async (manager) => {
      const row = manager.create(UserCourseProgressEntity, {
        user: { id: userId } as any,
        userId,
        course: { id: courseId } as any,
        courseId,
        status: CourseStatus.IN_PROGRESS,
        progressPercent: 0,
        startedAt: new Date(),
        lastAccessedAt: new Date(),
      });

      return manager.save(UserCourseProgressEntity, row);
    });
  }

  async touchLastAccess(userId: number, courseId: number) {
    await this.repository.update(
      { userId, courseId },
      { lastAccessedAt: new Date() },
    );
  }
}
