import { Column, Entity, ManyToOne, Index, JoinColumn } from 'typeorm';
import { CustomEntity } from './custom.entity';
import { UserEntity } from './user.entity';
import { CourseEntity } from './course.entity';

export enum AccessKind {
  FREE = 'FREE',
  ONE_TIME = 'ONE_TIME',
  SUBSCRIPTION = 'SUBSCRIPTION',
  ADMIN_GRANTED = 'ADMIN_GRANTED',
}

export enum AccessStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
  PENDING = 'PENDING'
}

@Entity({ name: 'course_access' })
@Index(['userId', 'courseId'], { unique: true })
@Index(['userId', 'status'])
export class CourseAccessEntity extends CustomEntity {
  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'course_id' })
  courseId: number;

  @ManyToOne(() => UserEntity, (u) => u.courseAccess, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ManyToOne(() => CourseEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: CourseEntity;

  @Column({ type: 'enum', enum: AccessKind, default: AccessKind.FREE })
  kind: AccessKind;

  @Column({ type: 'enum', enum: AccessStatus, default: AccessStatus.PENDING })
  status: AccessStatus;

  // For subscription/time-bound access. For ONE_TIME/FREE this can be null.
  @Column({ type: 'timestamptz', nullable: true })
  startsAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  endsAt: Date | null;

  // Payment linkage (webhook)
  @Column({ nullable: true })
  provider: string | null; // 'paystack' | 'flutterwave' | etc

  @Column({ nullable: true })
  providerRef: string | null; // transactionRef / subscriptionCode etc
}
