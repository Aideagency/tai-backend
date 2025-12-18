// src/database/entities/user-lesson-progress.entity.ts
import { Column, Entity, Index, ManyToOne, JoinColumn } from 'typeorm';
import { CustomEntity } from './custom.entity';
import { UserEntity } from './user.entity';
import { LessonEntity } from './lesson.entity';
import { UserCourseProgressEntity } from './user-course-progress.entity';

export enum LessonProgressStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

@Entity({ name: 'UserLessonProgress' })
@Index(['userId', 'courseProgressId', 'lessonId'], { unique: true })
export class UserLessonProgressEntity extends CustomEntity {
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => UserCourseProgressEntity, (ucp) => ucp.lessonProgress, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'course_progress_id' })
  userCourseProgress: UserCourseProgressEntity;

  @Column({ name: 'course_progress_id' })
  courseProgressId: string;

  @ManyToOne(() => LessonEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lesson_id' })
  lesson: LessonEntity;

  @Column({ name: 'lesson_id' })
  lessonId: string;

  @Column({
    type: 'enum',
    enum: LessonProgressStatus,
    default: LessonProgressStatus.NOT_STARTED,
  })
  status: LessonProgressStatus;

  @Column({ type: 'float', default: 0 })
  progressPercent: number; // for video/doc reading % if you want

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  lastAccessedAt: Date | null;
}
