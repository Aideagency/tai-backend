import { Column, Entity, ManyToOne } from 'typeorm';
import { CustomEntity } from './custom.entity';
import { UserEntity } from './user.entity';
import { CourseEntity } from './course.entity';

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export enum SubscriptionPlan {
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM',
}

@Entity({ name: 'UserSubscriptions' })
export class UserSubscriptionEntity extends CustomEntity {
  @ManyToOne(() => UserEntity, (user) => user.subscriptions)
  user: UserEntity;

  @ManyToOne(() => CourseEntity, (course) => course.subscriptions)
  course: CourseEntity;

  @Column()
  userId: string; // FK to UserEntity

  @Column()
  courseId: string; // FK to CourseEntity

  @Column({
    type: 'enum',
    enum: SubscriptionPlan,
    default: SubscriptionPlan.BASIC,
  })
  subscriptionPlan: SubscriptionPlan; // Tracks the subscription plan type (e.g., BASIC, PREMIUM)

  @Column({ type: 'timestamp', nullable: true })
  subscriptionStartDate: Date | null; // When the user subscribes to the course

  @Column({ type: 'timestamp', nullable: true })
  subscriptionEndDate: Date | null; // When the subscription expires (this will be pulled from Zoho, if needed)

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus; // Tracks whether the subscription is active, expired, or cancelled
}
