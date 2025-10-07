import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { CustomEntity } from './custom.entity';
import { UserEntity } from './user.entity';
import { PrayerWallEntity } from './prayer-wall.entity';

@Entity({ name: 'prayer_comments' })
@Index('idx_prayer_comment_created_at', ['createdAt'])
export class PrayerCommentEntity extends CustomEntity {
  @Column({ type: 'text' })
  comment: string;

  @ManyToOne(() => PrayerWallEntity, (p) => p.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'prayer_id' })
  @Index('idx_prayer_comment_prayer_id')
  prayer: PrayerWallEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  @Index('idx_prayer_comment_user_id')
  user: UserEntity;

  @ManyToOne(() => PrayerCommentEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parent_comment_id' })
  @Index('idx_prayer_comment_parent_id')
  parent: PrayerCommentEntity | null;

  @Column({ type: 'boolean', default: true })
  isVisible: boolean;
}
