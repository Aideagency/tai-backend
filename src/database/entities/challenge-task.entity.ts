import { Column, Entity, ManyToOne, Index } from 'typeorm';
import { CustomEntity } from './custom.entity';
import { ChallengeEntity } from './challenge.entity';

export enum TaskCadence {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
}

@Entity({ name: 'ChallengeTasks' })
export class ChallengeTaskEntity extends CustomEntity {
  @ManyToOne(() => ChallengeEntity, (c) => c.tasks, { onDelete: 'CASCADE' })
  @Index()
  challenge: ChallengeEntity;

  @Column({ type: 'enum', enum: TaskCadence, default: TaskCadence.DAILY })
  cadence: TaskCadence; // DAILY or WEEKLY

  @Column({ type: 'int', nullable: true })
  dayNumber: number | null; // 1..durationDays (for weekly items, you can store dayNumber of the week or use weekNumber below)

  @Column({ type: 'int', nullable: true })
  weekNumber: number | null; // for weekly Saturday reviews, etc.

  @Column()
  title: string; // e.g., "Pray together for 5 minutes"

  @Column({ type: 'text', nullable: true })
  instructions: string;

  @Column({ default: false })
  isMilestone: boolean; // award weekly badge, etc.
}
