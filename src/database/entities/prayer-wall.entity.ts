// prayer-wall.entity.ts
import {
  Column,
  Entity,
  OneToMany,
  ManyToOne,
  Index,
  JoinColumn,
} from 'typeorm';
import { CustomEntity } from './custom.entity';
import { PrayerCommentEntity } from './prayer-comment.entity';
import { PrayerAmenEntity } from './prayer-amen.entity';
import { UserEntity } from './user.entity';

@Entity({ name: 'prayers' })
@Index('idx_prayers_is_visible', ['isVisible'])
@Index('idx_prayers_created_at', ['createdAt'])
@Index('idx_prayers_last_activity', ['lastActivityAt'])
export class PrayerWallEntity extends CustomEntity {
  /**
   * Optional short title for the prayer.
   */
  @Column({ length: 160, nullable: true })
  title: string | null;

  /**
   * Main prayer text (required).
   */
  @Column({ type: 'text', nullable: false })
  body: string;

  /**
   * Attribution when shared (e.g., "via Agudah App").
   */
  @Column({ length: 120, nullable: true })
  sourceAttribution: string | null;

  /**
   * Visibility toggle (useful for moderation/hard hide without deletion).
   */
  @Column({ type: 'boolean', default: true })
  isVisible: boolean;

  /**
   * Answer state: pending vs answered.
   * - Pending: isAnswered=false, answeredAt=null
   * - Answered: isAnswered=true, answeredAt set
   */
  @Column({ type: 'boolean', default: false })
  isAnswered: boolean;

  @Column({ type: 'timestamp', nullable: true })
  answeredAt: Date | null;

  /**
   * Allow user to post without showing their identity publicly.
   */
  @Column({ type: 'boolean', default: false })
  isAnonymous: boolean;

  /**
   * Lightweight counters—kept in sync by service-layer transactions.
   */
  @Column({ type: 'int', default: 0 })
  amenCount: number;

  @Column({ type: 'int', default: 0 })
  commentCount: number;

  @Column({ type: 'int', default: 0 })
  shareCount: number;

  /**
   * Optional abuse/report counter.
   */
  @Column({ type: 'int', default: 0 })
  reportedCount: number;

  /**
   * For “active” feed sorting (update on comment/amen/share).
   */
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastActivityAt: Date;

  /**
   * Author (nullable if you ever allow guest/removed users).
   */
  @ManyToOne(() => UserEntity, (user) => user.prayers, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'user_id' })
  @Index('idx_prayers_user_id')
  user: UserEntity | null;

  /**
   * Relations: comments and amens.
   */
  @OneToMany(() => PrayerCommentEntity, (c) => c.prayer, { cascade: true })
  comments: PrayerCommentEntity[];

  @OneToMany(() => PrayerAmenEntity, (a) => a.prayer, { cascade: true })
  amens: PrayerAmenEntity[];
}
