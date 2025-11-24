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

  // The counselling offer being booked
  @ManyToOne(() => CounsellingEntity, (c) => c.bookings, {
    onDelete: 'CASCADE',
  })
  counselling: CounsellingEntity;

  // Optionally override counsellor per booking (in case multiple counsellors share a product)
  @ManyToOne(() => AdminEntity, { nullable: true })
  counsellor: AdminEntity | null;

  // When this particular session starts/ends
  @Column({ type: 'timestamp' })
  startsAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  endsAt: Date | null;

  // Snapshot of duration at booking time (in minutes)
  @Column({ type: 'int', nullable: false })
  durationMinutes: number;

  // Snapshot of price at booking time (even if the counselling price changes later)
  @Column({ type: 'decimal', nullable: false })
  priceAtBooking: number;

  @Column({
    type: 'enum',
    enum: CounsellingBookingStatus,
    default: CounsellingBookingStatus.PENDING_PAYMENT,
  })
  status: CounsellingBookingStatus;

  // For ONLINE sessions – e.g. Zoom, Meet link
  @Column({ nullable: true })
  meetingLink: string | null;

  // For OFFLINE sessions – address or location text
  @Column({ nullable: true })
  locationText: string | null;

  // Booking reference / code (for emails, lookups, etc.)
  @Column({ nullable: true, unique: true })
  reference: string | null;

  // Notes from the client (what they’re dealing with, context, etc.)
  @Column({ type: 'text', nullable: true })
  clientNotes: string | null;

  // Notes from the counsellor about this booking
  @Column({ type: 'text', nullable: true })
  counsellorNotes: string | null;

  // Whether client has attended / checked in (separate from status if you want)
  @Column({ type: 'boolean', default: false })
  attended: boolean;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date | null;

  @Column({ nullable: true })
  transaction_ref: string;
}
