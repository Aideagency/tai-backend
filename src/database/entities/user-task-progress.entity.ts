import { Column, Entity, ManyToOne, Index } from 'typeorm';
import { CustomEntity } from './custom.entity';
import { UserChallengeEntity } from './user-challenge.entity';
import { ChallengeTaskEntity } from './challenge-task.entity';

@Entity({ name: 'UserTaskProgress' })
@Index(['userChallenge', 'task'], { unique: true })
export class UserTaskProgressEntity extends CustomEntity {
  @ManyToOne(() => UserChallengeEntity, (uc) => uc.progress, {
    onDelete: 'CASCADE',
  })
  userChallenge: UserChallengeEntity;

  @ManyToOne(() => ChallengeTaskEntity, { onDelete: 'CASCADE' })
  task: ChallengeTaskEntity;

  @Column({ default: false })
  completedByUser: boolean;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date | null;

  // Optional — dual confirmation for couples
  @Column({ default: false })
  confirmedByPartner: boolean;

  @Column({ nullable: true })
  partnerUserId: string | null; // for couple linking

  @Column({ type: 'timestamp', nullable: true })
  confirmedAt: Date | null;
}
