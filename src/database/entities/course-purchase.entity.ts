import { Column, Entity, ManyToOne, OneToMany, Index } from 'typeorm';
import { CustomEntity } from './custom.entity';

export enum PurchaseStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

@Entity({ name: 'course_purchases' })
@Index(['provider', 'providerRef'], { unique: true })
export class CoursePurchaseEntity extends CustomEntity {
  @Column()
  userId: number;

  @Column()
  courseId: number;

  @Column()
  provider: string; // 'paystack'

  @Column()
  providerRef: string; // reference

  @Column({
    type: 'enum',
    enum: PurchaseStatus,
    default: PurchaseStatus.PENDING,
  })
  status: PurchaseStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ default: 'NGN' })
  currency: string;
}
