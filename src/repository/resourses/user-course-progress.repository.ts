import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../base.repository';
import { UserCourseProgressEntity } from 'src/database/entities/user-course-progress.entity';
import { CourseStatus } from 'src/database/entities/user-course-progress.entity';

@Injectable()
export class UserCourseProgressRepository extends BaseRepository<
  UserCourseProgressEntity,
  Repository<UserCourseProgressEntity>
> {
  protected logger = new Logger(UserCourseProgressRepository.name);

  constructor(
    @InjectRepository(UserCourseProgressEntity)
    repository: Repository<UserCourseProgressEntity>,
  ) {
    super(repository);
  }

  //   Create or update a user's progress for a course
  async createOrUpdateProgress(
    userId: string,
    courseId: string,
    status: CourseStatus,
    progressPercent: number,
    startedAt: Date | null = null,
    completedAt: Date | null = null,
  ): Promise<UserCourseProgressEntity> {
    const existingProgress = await this.findOne({ userId, courseId });

    if (existingProgress) {
      // Update existing progress
      existingProgress.status = status;
      existingProgress.progressPercent = progressPercent;
      existingProgress.startedAt = startedAt;
      existingProgress.completedAt = completedAt;
      return this.repository.save(existingProgress);
    }

    // Create a new progress record
    const newProgress = this.repository.create({
      userId,
      courseId,
      status,
      progressPercent,
      startedAt,
      completedAt,
    });

    return this.repository.save(newProgress);
  }

  // Find progress for a specific user and course
  async findByUserAndCourse(
    userId: string,
    courseId: string,
  ): Promise<UserCourseProgressEntity | undefined> {
    return this.findOne({ userId, courseId });
  }

  // Find all progress records for a specific user
  async findByUser(userId: string): Promise<UserCourseProgressEntity[]> {
    return this.findAll({ userId });
  }
}
