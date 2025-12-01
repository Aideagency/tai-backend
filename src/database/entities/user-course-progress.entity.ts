import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { CustomEntity } from './custom.entity';
import { UserEntity } from './user.entity';
import { CourseEntity } from './course.entity';
import { UserLessonProgressEntity } from './user-lesson-progress.entity';

export enum CourseStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

@Entity({ name: 'UserCourseProgress' })
export class UserCourseProgressEntity extends CustomEntity {
  @ManyToOne(() => UserEntity, (user) => user.courseProgress)
  user: UserEntity;

  @Column()
  userId: string;

  @ManyToOne(() => CourseEntity, (course) => course.progressRecords)
  course: CourseEntity;

  @Column()
  courseId: string;

  @Column({
    type: 'enum',
    enum: CourseStatus,
    default: CourseStatus.NOT_STARTED,
  })
  status: CourseStatus;

  @Column({ type: 'float', default: 0 })
  progressPercent: number; // 0–100

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  lastAccessedAt: Date | null;

  @OneToMany(() => UserLessonProgressEntity, (ulp) => ulp.userCourseProgress)
  lessonProgress: UserLessonProgressEntity[];
}
