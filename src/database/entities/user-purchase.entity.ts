// src/database/entities/user-purchase.entity.ts
import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { CustomEntity } from './custom.entity';
import { UserEntity } from './user.entity';

export enum PurchaseItemType {
  COURSE = 'COURSE',
  BOOK = 'BOOK',
}

export enum PurchaseStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

@Entity({ name: 'UserPurchases' })
@Index(['userId', 'itemType', 'itemId'], { unique: false })
export class UserPurchaseEntity extends CustomEntity {
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  user: UserEntity;

  @Column()
  userId: number;

  @Column({ type: 'enum', enum: PurchaseItemType })
  itemType: PurchaseItemType;

  @Column()
  itemId: number; // e.g CourseEntity.id or BookEntity.id (your local DB content)

  @Column({
    type: 'enum',
    enum: PurchaseStatus,
    default: PurchaseStatus.PENDING,
  })
  status: PurchaseStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ nullable: true })
  paymentRef: string | null; // Paystack reference, etc.
}
