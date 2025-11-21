import { Column, Entity, ManyToOne, Index } from 'typeorm';
import { CustomEntity } from './custom.entity';
import { UserEntity } from './user.entity';
import { EventEntity } from './event.entity';
import { TransactionEntity } from './transaction.entity';

export enum RegistrationStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  CONFIRMED = 'CONFIRMED', // RSVP successful or payment confirmed
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

@Entity({ name: 'EventRegistrations' })
@Index(['user', 'event'], { unique: false })
export class EventRegistrationEntity extends CustomEntity {
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  user: UserEntity;

  @ManyToOne(() => EventEntity, (e) => e.registrations, { onDelete: 'CASCADE' })
  event: EventEntity;

  @Column({
    type: 'enum',
    enum: RegistrationStatus,
    enumName: 'event_registration_status_enum', // any name you like
    default: RegistrationStatus.PENDING_PAYMENT, // optional but usually useful
  })
  status: RegistrationStatus;

  @Column({ type: 'int', default: 1 })
  quantity: number; // Always 1 since users can only register once

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  unitPrice: string | null; // Can be null for free events

  @ManyToOne(() => TransactionEntity, { nullable: true })
  transaction: TransactionEntity | null;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt: Date | null;
}
