import { Column, Entity, ManyToOne, OneToMany, Index } from 'typeorm';
import { CustomEntity } from './custom.entity';
import { UserEntity } from './user.entity';
import { CounsellingBookingEntity } from './counselling-booking.entity'; // if/when you create it

export enum CounsellingMode {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
}

export enum CounsellingStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum CounsellingType {
  INDIVIDUAL = 'INDIVIDUAL',
  COUPLES = 'COUPLES',
  FAMILY = 'FAMILY',
  GROUP = 'GROUP',
}

@Entity({ name: 'Counsellings' })
@Index(['status', 'mode'])
@Index(['type'])
export class CounsellingEntity extends CustomEntity {
  @Column({ nullable: false })
  title: string;

  // Short overview (e.g. 1–2 lines)
  @Column({ type: 'text', nullable: true })
  description: string | null;

  // In minutes
  @Column({ type: 'int', nullable: false })
  durationMinutes: number;

  @Column({ type: 'enum', enum: CounsellingMode, nullable: false })
  mode: CounsellingMode; // ONLINE or OFFLINE

  @Column({
    type: 'enum',
    enum: CounsellingStatus,
    default: CounsellingStatus.PUBLISHED,
  })
  status: CounsellingStatus;

  @Column({
    type: 'enum',
    enum: CounsellingType,
    default: CounsellingType.INDIVIDUAL,
  })
  type: CounsellingType;

  // Cover image for listing / detail pages
  @Column({ nullable: true })
  coverUrl: string | null;

  @Column({ nullable: true })
  coverUrlPublicId: string | null;

  // Price per session (null or 0 for free)
  @Column({ type: 'decimal', nullable: true })
  price: number | null;

  // --- "Other descriptions" / extra info fields ---

  // What the client will get out of this session
  @Column({ type: 'text', nullable: true })
  whatYouGet: string | null;

  // Ideal audience (e.g. "Students dealing with exam stress")
  @Column({ type: 'text', nullable: true })
  whoItsFor: string | null;

  // How it works / structure (e.g. "Intro, assessment, action plan")
  @Column({ type: 'text', nullable: true })
  howItWorks: string | null;

  // Optional notes from counsellor (policies, rescheduling, etc.)
  @Column({ type: 'text', nullable: true })
  counsellorNotes: string | null;

  // Max number of clients for this counselling offer (useful for group sessions)
  @Column({ type: 'int', nullable: true })
  maxClientsPerSession: number | null;

  // Whether this counselling offer is active and bookable
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  // Highlight on homepage / featured lists
  @Column({ type: 'boolean', default: false })
  isFeatured: boolean;

  // The counsellor / owner of this counselling offer
  @ManyToOne(() => UserEntity, { nullable: true })
  counsellor: UserEntity | null;

  //   If you later add a booking entity, you can connect it here:
  @OneToMany(() => CounsellingBookingEntity, (b) => b.counselling)
  bookings: CounsellingBookingEntity[];
}
