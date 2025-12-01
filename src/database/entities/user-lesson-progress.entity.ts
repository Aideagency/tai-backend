import { Column, Entity, ManyToOne } from 'typeorm';
import { CustomEntity } from './custom.entity';
import { LessonEntity } from './lesson.entity';
import { UserCourseProgressEntity } from './user-course-progress.entity';

@Entity({ name: 'UserLessonProgress' })
export class UserLessonProgressEntity extends CustomEntity {
  @ManyToOne(() => UserCourseProgressEntity, (ucp) => ucp.lessonProgress)
  userCourseProgress: UserCourseProgressEntity;

  @Column()
  userCourseProgressId: string;

  @ManyToOne(() => LessonEntity)
  lesson: LessonEntity;

  @Column()
  lessonId: string;

  @Column({ default: false })
  isCompleted: boolean;

  @Column({ type: 'float', default: 0 })
  progressPercent: number; // optional, 0–100

  @Column({ type: 'int', default: 0 })
  secondsWatched: number;

  @Column({ type: 'timestamp', nullable: true })
  lastAccessedAt: Date | null;
}
