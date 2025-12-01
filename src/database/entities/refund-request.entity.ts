import { Column, Entity, ManyToOne, Index } from 'typeorm';
import { CustomEntity } from './custom.entity';
import { UserEntity } from './user.entity';
import { EventRegistrationEntity } from './event-registration.entity';
import { TransactionEntity } from './transaction.entity';
import { CounsellingBookingEntity } from './counselling-booking.entity';

export enum RefundType {
  FULL = 'FULL',
  PARTIAL = 'PARTIAL',
  OTHER = 'OTHER',
}

export enum RefundStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PROCESSED = 'PROCESSED',
}

export enum PaidFor {
  EVENT = 'EVENT',
  COUNSELLING = 'COUNSELLING',
  COURSE = 'COURSE',
}

@Entity({ name: 'RefundRequests' })
@Index(['registration', 'status'], { unique: false })
export class RefundRequestEntity extends CustomEntity {
  /**
   * If refund is for an event, this will be filled
   */
  @ManyToOne(() => EventRegistrationEntity, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  registration: EventRegistrationEntity | null;

  /**
   * If refund is for counselling booking, this will be filled
   */
  @ManyToOne(() => CounsellingBookingEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  counsellingBooking: CounsellingBookingEntity | null;

  /**
   * Original transaction reference
   */
  @ManyToOne(() => TransactionEntity, { nullable: true, onDelete: 'SET NULL' })
  transaction: TransactionEntity | null;

  /**
   * User who initiated the refund
   */
  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  requestedBy: UserEntity | null;

  /**
   * The refund type
   */
  @Column({
    type: 'enum',
    enum: RefundType,
    enumName: 'refund_request_type_enum',
  })
  type: RefundType;

  /**
   * Refund lifecycle status
   */
  @Column({
    type: 'enum',
    enum: RefundStatus,
    enumName: 'refund_request_status_enum',
    default: RefundStatus.PENDING,
  })
  status: RefundStatus;

  /**
   * What the original payment was for — event, counselling or course
   */
  @Column({
    type: 'enum',
    enum: PaidFor,
    enumName: 'refund_paid_for_enum',
  })
  paidFor: PaidFor;

  /**
   * Amount user requested to be refunded
   */
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  requestedAmount: string;

  /**
   * Amount approved to be refunded
   */
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  approvedAmount: string | null;

  /**
   * User-provided refund reason
   */
  @Column({ type: 'text', nullable: true })
  reason: string | null;

  /**
   * Admin approval timestamps & user
   */
  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  approvedBy: UserEntity | null;

  /**
   * Timestamp when refund was processed
   */
  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date | null;

  /**
   * Gateway or bank reference for completed refund
   */
  @Column({ nullable: true })
  externalReference: string | null;
}
