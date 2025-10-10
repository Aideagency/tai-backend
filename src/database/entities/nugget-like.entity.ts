import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
  RelationId,
} from 'typeorm';
import { CustomEntity } from './custom.entity';
import { NuggetEntity } from './nugget.entity';
import { UserEntity } from './user.entity';

export enum NuggetReaction {
  LIKE = 'LIKE',
  LOVE = 'LOVE',
  INSPIRED = 'INSPIRED',
}

@Entity({ name: 'nugget_likes' })
@Unique('uq_nugget_like_user_reaction', ['nugget', 'user', 'reaction'])
export class NuggetLikeEntity extends CustomEntity {
  @ManyToOne(() => NuggetEntity, (n) => n.likes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'nugget_id' })
  @Index('idx_nugget_like_nugget_id')
  nugget: NuggetEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  @Index('idx_nugget_like_user_id')
  user: UserEntity;

  @RelationId((like: NuggetLikeEntity) => like.nugget)
  nuggetId: number;

  @RelationId((like: NuggetLikeEntity) => like.user)
  userId: number;

  @Column({ type: 'enum', enum: NuggetReaction, default: NuggetReaction.LIKE })
  reaction: NuggetReaction;
}
