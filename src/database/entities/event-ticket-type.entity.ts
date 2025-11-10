import { Column, Entity, ManyToOne, OneToMany, Index } from 'typeorm';
import { CustomEntity } from './custom.entity';
import { EventEntity } from './event.entity';
import { EventRegistrationEntity } from './event-registration.entity';

@Entity({ name: 'EventTicketTypes' })
@Index(['event', 'isActive'])
export class EventTicketTypeEntity extends CustomEntity {
  @ManyToOne(() => EventEntity, (e) => e.ticketTypes, { onDelete: 'CASCADE' })
  event: EventEntity;

  @Column()
  name: string; // e.g., "General Admission", "VIP", "Free RSVP"

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  price: string; // 0 == free/RSVP

  @Column({ length: 3, default: 'NGN' })
  currency: string;

  @Column({ type: 'int', nullable: true })
  capacity: number | null; // cap for this tier

  @Column({ type: 'timestamp', nullable: true })
  salesStartAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  salesEndAt: Date | null;

  @Column({ default: true })
  isActive: boolean;

  // Refund policy knobs
  @Column({ default: false })
  isRefundable: boolean;

  @Column({ type: 'int', nullable: true })
  refundWindowDays: number | null; // refundable until X days before startsAt

  @Column({ type: 'text', nullable: true })
  refundPolicyNote: string | null;

  @OneToMany(() => EventRegistrationEntity, (r) => r.ticketType)
  registrations: EventRegistrationEntity[];
}
