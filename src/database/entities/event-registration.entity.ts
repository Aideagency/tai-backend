import { Column, Entity, ManyToOne, OneToMany, Index } from 'typeorm';
import { CustomEntity } from './custom.entity';
import { UserEntity } from './user.entity';
import { EventEntity, RegistrationStatus } from './event.entity';
import { EventTicketTypeEntity } from './event-ticket-type.entity';
// import { RegistrationStatus } from './user.entity'; // or enums file
import { TransactionEntity } from './transaction.entity';
import { EventTicketEntity } from './event-ticket.entity';
import { RefundRequestEntity } from './refund-request.entity';

@Entity({ name: 'EventRegistrations' })
@Index(['user', 'event'], { unique: false })
export class EventRegistrationEntity extends CustomEntity {
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  user: UserEntity;

  @ManyToOne(() => EventEntity, (e) => e.registrations, { onDelete: 'CASCADE' })
  event: EventEntity;

  @ManyToOne(() => EventTicketTypeEntity, (tt) => tt.registrations, {
    nullable: true,
  })
  ticketType: EventTicketTypeEntity | null;

  @Column({ type: 'enum', enum: RegistrationStatus })
  status: RegistrationStatus;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  // snapshot the price at purchase time (even if ticketType price later changes)
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  unitPrice: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalAmount: string;

  @ManyToOne(() => TransactionEntity, { nullable: true })
  transaction: TransactionEntity | null;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt: Date | null;

  @OneToMany(() => EventTicketEntity, (t) => t.registration, { cascade: true })
  tickets: EventTicketEntity[];

  @OneToMany(() => RefundRequestEntity, (rr) => rr.registration)
  refunds: RefundRequestEntity[];
}
