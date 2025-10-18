import { Column, Entity, ManyToOne, Index } from 'typeorm';
import { CustomEntity } from './custom.entity';
import { UserEntity } from './user.entity';
import { ChallengeEntity } from './challenge.entity';

@Entity({ name: 'ChallengeReflections' })
export class ChallengeReflectionEntity extends CustomEntity {
  @ManyToOne(() => ChallengeEntity, { onDelete: 'CASCADE' })
  @Index()
  challenge: ChallengeEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @Index()
  user: UserEntity;

  @Column({ type: 'int', nullable: true })
  weekNumber: number | null;

  @Column({ type: 'text' })
  content: string;

  @Column({ default: 0 })
  likesCount: number;

  @Column({ default: false })
  isPinned: boolean;
}
