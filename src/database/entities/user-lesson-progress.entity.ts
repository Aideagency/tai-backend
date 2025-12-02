import { Column, Entity, ManyToOne } from 'typeorm';
import { CustomEntity } from './custom.entity';
import { LessonEntity } from './lesson.entity';
import { UserCourseProgressEntity } from './user-course-progress.entity';

@Entity({ name: 'UserLessonProgress' })
export class UserLessonProgressEntity extends CustomEntity {
  @ManyToOne(() => UserCourseProgressEntity, (ucp) => ucp.lessonProgress)
  userCourseProgress: UserCourseProgressEntity;

  @Column()
  userCourseProgressId: string; // FK to UserCourseProgressEntity

  @ManyToOne(() => LessonEntity)
  lesson: LessonEntity;

  @Column()
  lessonId: string; // FK to LessonEntity

  @Column({ default: false })
  isCompleted: boolean;

  @Column({ type: 'float', default: 0 })
  progressPercent: number; // Tracks lesson progress percentage (0–100)

  @Column({ type: 'int', default: 0 })
  secondsWatched: number; // Tracks time spent on a lesson

  @Column({ type: 'timestamp', nullable: true })
  lastAccessedAt: Date | null; // Tracks the last accessed time for the lesson
}
