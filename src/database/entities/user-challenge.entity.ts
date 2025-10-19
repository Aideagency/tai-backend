import { Column, Entity, ManyToOne, OneToMany, Index } from 'typeorm';
import { CustomEntity } from './custom.entity';
import { UserEntity } from './user.entity';
import { ChallengeEntity } from './challenge.entity';
import { UserTaskProgressEntity } from './user-task-progress.entity';

@Entity({ name: 'UserChallenges' })
@Index(['user', 'challenge'], { unique: true })
export class UserChallengeEntity extends CustomEntity {
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  user: UserEntity;

  @ManyToOne(() => ChallengeEntity, { onDelete: 'CASCADE' })
  challenge: ChallengeEntity;

  @Column({ type: 'timestamp', nullable: true })
  startDate: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  endDate: Date | null;

  @Column({ default: 0 })
  streakCount: number;

  @Column({ default: 0 })
  progressPercent: number; // 0-100 (derived but can cache for fast Today UI)

  @Column({ type: 'timestamp', nullable: true })
  lastCheckInAt: Date | null;

  @Column({ default: false })
  isCompleted: boolean;

  @Column({ default: false })
  isArchived: boolean; // after duration ends, auto-archive

  @OneToMany(() => UserTaskProgressEntity, (p) => p.userChallenge, {
    cascade: true,
  })
  progress: UserTaskProgressEntity[];
}
