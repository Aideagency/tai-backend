import { Column, Entity, ManyToOne, OneToMany, Index } from 'typeorm';
import { CustomEntity } from './custom.entity';
import { UserEntity } from './user.entity';
import { EventTicketTypeEntity } from './event-ticket-type.entity';
import { EventRegistrationEntity } from './event-registration.entity';

export enum EventType {
  COMMUNITY = 'COMMUNITY',
  CONFERENCE = 'CONFERENCE',
  RETREAT = 'RETREAT',
}

export enum EventStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  CANCELLED = 'CANCELLED',
  ENDED = 'ENDED',
}

export enum RegistrationStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  CONFIRMED = 'CONFIRMED', // RSVP successful or payment confirmed
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum TicketStatus {
  ACTIVE = 'ACTIVE',
  USED = 'USED',
  CANCELLED = 'CANCELLED',
}

export enum RefundStatus {
  REQUESTED = 'REQUESTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PROCESSED = 'PROCESSED',
}

@Entity({ name: 'Events' })
@Index(['type', 'status'])
@Index(['startsAt'])
export class EventEntity extends CustomEntity {
  @Column({ nullable: false })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: EventType })
  type: EventType;

  @Column({ type: 'enum', enum: EventStatus, default: EventStatus.DRAFT })
  status: EventStatus;

  @Column({ nullable: true })
  locationText: string | null; // e.g., "Eko Hotel, Lagos"

  @Column({ nullable: true })
  locationUrl: string | null; // online link if virtual/hybrid

  @Column({ type: 'timestamp' })
  startsAt: Date;

  @Column({ type: 'timestamp' })
  endsAt: Date;

  @Column({ type: 'int', nullable: true })
  capacity: number | null; // overall cap (can be <= sum of ticket caps)

  // For easy calendar export or magic link
  @Column({ nullable: true, unique: true })
  icsToken: string | null;

  @ManyToOne(() => UserEntity, { nullable: true })
  organizer: UserEntity | null;

  @OneToMany(() => EventTicketTypeEntity, (tt) => tt.event, { cascade: true })
  ticketTypes: EventTicketTypeEntity[];

  @OneToMany(() => EventRegistrationEntity, (r) => r.event)
  registrations: EventRegistrationEntity[];
}
