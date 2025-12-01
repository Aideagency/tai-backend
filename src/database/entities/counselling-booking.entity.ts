import { Column, Entity, ManyToOne, Index } from 'typeorm';
import { CustomEntity } from './custom.entity';
import { UserEntity } from './user.entity';
import { CounsellingEntity } from './counselling.entity';
import { AdminEntity } from './admin.entity';
// import { TransactionEntity } from 'src/database/entities/transaction.entity'; // if/when you have it

export enum CounsellingBookingStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
  REFUNDED = 'REFUNDED',
}

@Entity({ name: 'CounsellingBookings' })
@Index(['user', 'counselling'])
@Index(['status'])
@Index(['startsAt'])
export class CounsellingBookingEntity extends CustomEntity {
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  user: UserEntity;

  @ManyToOne(() => CounsellingEntity, (c) => c.bookings, {
    onDelete: 'CASCADE',
  })
  counselling: CounsellingEntity;

  @ManyToOne(() => AdminEntity, { nullable: true })
  counsellor: AdminEntity | null;

  @Column({ type: 'timestamp' })
  startsAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  endsAt: Date | null;

  @Column({ type: 'int', nullable: false })
  durationMinutes: number;

  @Column({ type: 'decimal', nullable: false })
  priceAtBooking: number;

  @Column({
    type: 'enum',
    enum: CounsellingBookingStatus,
    default: CounsellingBookingStatus.PENDING_PAYMENT,
  })
  status: CounsellingBookingStatus;

  @Column({ nullable: true })
  meetingLink: string | null;

  @Column({ nullable: true })
  locationText: string | null;

  @Column({ nullable: true, unique: true })
  reference: string | null;

  @Column({ type: 'text', nullable: true })
  clientNotes: string | null;

  @Column({ type: 'text', nullable: true })
  counsellorNotes: string | null;

  @Column({ type: 'boolean', default: false })
  attended: boolean;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date | null;

  @Column({ nullable: true })
  transaction_ref: string;

  // 👇 NEW: user can only reschedule once
  @Column({ type: 'boolean', default: false })
  hasRescheduled: boolean;
}

