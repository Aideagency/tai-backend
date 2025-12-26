import { Column, Entity, ManyToOne, OneToMany, Index } from 'typeorm';
import { CustomEntity } from './custom.entity';
import { UserEntity } from './user.entity';
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

export enum EventMode {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
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

  @Column({ type: 'enum', enum: EventStatus, default: EventStatus.PUBLISHED })
  status: EventStatus;

  @Column({ type: 'enum', enum: EventMode, nullable: false })
  mode: EventMode; // ONLINE or OFFLINE

  @Column({ nullable: true })
  locationText: string | null; // Only for OFFLINE events, e.g., "Eko Hotel, Lagos"

  @Column({ nullable: true })
  locationUrl: string | null; // Only for ONLINE events, e.g., Zoom link

  @Column({ nullable: true })
  coverImageUrl: string | null; // URL for the event cover image

  @Column({ nullable: true })
  coverUrlPublicId: string | null;

  @Column({ type: 'timestamp' })
  startsAt: Date;

  @Column({ type: 'timestamp' })
  endsAt: Date;

  @Column({ type: 'int', nullable: true })
  capacity: number | null; // overall cap (can be <= sum of ticket caps)

  @Column({ nullable: true, unique: true })
  icsToken: string | null; // For easy calendar export or magic link

  @ManyToOne(() => UserEntity, { nullable: true })
  organizer: UserEntity | null;

  @Column({ type: 'decimal', nullable: true })
  price: number | null; // Price for paid events (null for free events)

  // Restrict to one ticket per user for paid events
  @OneToMany(() => EventRegistrationEntity, (r) => r.event)
  registrations: EventRegistrationEntity[];

  // Business logic to ensure only one ticket per user for paid events can be enforced in your services or event registration logic.
}
