import { Column, Entity, OneToMany } from 'typeorm';
import { CustomEntity } from './custom.entity';
import { LessonEntity } from './lesson.entity';
import { UserCourseProgressEntity } from './user-course-progress.entity';
import { UserSubscriptionEntity } from './user-subscription.entity'; // Add this import

export enum CourseAccessType {
  FREE = 'FREE',
  PAID = 'PAID',
}

@Entity({ name: 'Courses' })
export class CourseEntity extends CustomEntity {
  @Column({ unique: true })
  zoho_course_id: string; // Zoho’s course ID

  @Column({ nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  thumbnailUrl: string;

  @Column({
    type: 'enum',
    enum: CourseAccessType,
    default: CourseAccessType.FREE,
  })
  accessType: CourseAccessType; // Tracks whether the course is free or paid

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price: number | null; // Only relevant for PAID courses

  @Column({ default: true })
  isPublished: boolean; // Indicates if the course is published or not

  @OneToMany(() => LessonEntity, (lesson) => lesson.course)
  lessons: LessonEntity[];

  @OneToMany(() => UserCourseProgressEntity, (progress) => progress.course)
  progressRecords: UserCourseProgressEntity[];

  @OneToMany(
    () => UserSubscriptionEntity,
    (subscription) => subscription.course,
  )
  subscriptions: UserSubscriptionEntity[]; // Add this line to track subscriptions
}
