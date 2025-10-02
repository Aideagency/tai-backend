import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { CustomEntity } from './custom.entity';
import { NuggetEntity } from './nugget.entity';
import { UserEntity } from './user.entity';

@Entity({ name: 'nugget_comments' })
export class NuggetCommentEntity extends CustomEntity {
  @Column({ type: 'text' })
  comment: string;

  @ManyToOne(() => NuggetEntity, (n) => n.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'nugget_id' })
  @Index('idx_nugget_comment_nugget_id')
  nugget: NuggetEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  @Index('idx_nugget_comment_user_id')
  user: UserEntity;

  // Optional threaded comments
  @ManyToOne(() => NuggetCommentEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parent_comment_id' })
  @Index('idx_nugget_comment_parent_id')
  parent: NuggetCommentEntity | null;
}
