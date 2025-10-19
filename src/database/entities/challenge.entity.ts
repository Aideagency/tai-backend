import { Column, Entity, OneToMany, Index } from 'typeorm';
import { CustomEntity } from './custom.entity';
import { ChallengeTaskEntity } from './challenge-task.entity';
import { CommunityTag as CommunityType } from './user.entity';

export enum ChallengeStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export enum Visibility {
  PUBLIC = 'PUBLIC',
  COMMUNITY_ONLY = 'COMMUNITY_ONLY',
}

export enum ChallengeFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MIXED = 'MIXED', // e.g., daily + Saturday reviews
}

@Entity({ name: 'Challenges' })
export class ChallengeEntity extends CustomEntity {
  @Column()
  @Index()
  title: string;

  @Column({ type: 'enum', enum: CommunityType })
  community: CommunityType; // Singles, Married, Parents

  @Column({ type: 'int' })
  durationDays: number; // 7, 14, 42 (6 weeks)

  @Column({
    type: 'enum',
    enum: ChallengeFrequency,
    default: ChallengeFrequency.DAILY,
  })
  frequency: ChallengeFrequency;

  @Column({
    type: 'enum',
    enum: Visibility,
    default: Visibility.COMMUNITY_ONLY,
  })
  visibility: Visibility;

  @Column({ nullable: true })
  coverImageUrl: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  // Optional book reference (Singles sample)
  @Column({ nullable: true })
  bookTitle: string;

  @Column({ nullable: true })
  bookAuthor: string;

  @Column({
    type: 'enum',
    enum: ChallengeStatus,
    default: ChallengeStatus.DRAFT,
  })
  status: ChallengeStatus;

  @Column({ default: false })
  requireDualConfirmation: boolean; // couples confirm both sides

  @Column({ nullable: true })
  completionBadgeCode: string; // e.g. 'SELF_DISCOVERY_CHAMPION'

  @OneToMany(() => ChallengeTaskEntity, (t) => t.challenge, { cascade: true })
  tasks: ChallengeTaskEntity[];
}
