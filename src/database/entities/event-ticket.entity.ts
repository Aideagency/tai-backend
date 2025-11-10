import { Column, Entity, ManyToOne, Index } from 'typeorm';
import { CustomEntity } from './custom.entity';
import { EventRegistrationEntity } from './event-registration.entity';
import { TicketStatus } from './event.entity';

@Entity({ name: 'EventTickets' })
@Index(['code'], { unique: true })
export class EventTicketEntity extends CustomEntity {
  @ManyToOne(() => EventRegistrationEntity, (r) => r.tickets, {
    onDelete: 'CASCADE',
  })
  registration: EventRegistrationEntity;

  // e.g., TAI-ABC123XYZ
  @Column({ unique: true })
  code: string;

  // store a signed payload or URL you render as QR
  @Column({ type: 'text', nullable: true })
  qrPayload: string | null;

  @Column({ type: 'enum', enum: TicketStatus, default: TicketStatus.ACTIVE })
  status: TicketStatus;

  @Column({ type: 'timestamp', nullable: true })
  issuedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  usedAt: Date | null;
}
