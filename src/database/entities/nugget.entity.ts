import {
  Column,
  Entity,
  OneToMany,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CustomEntity } from './custom.entity';
// (You’ll create these next)
import { NuggetCommentEntity } from './nugget-comment.entity';
import { NuggetLikeEntity } from './nugget-like.entity';
import { AdminEntity } from './admin.entity';

export enum NuggetType {
  SINGLE = 'SINGLE',
  MARRIED = 'MARRIED',
  PARENT = 'PARENT',
  GENERAL = 'GENERAL',
}

@Entity({ name: 'nuggets' })
export class NuggetEntity extends CustomEntity {
  /**
   * Short title is optional; the nugget itself should be 1–2 sentences.
   */
  @Column({ length: 160, nullable: true })
  title: string | null;

  /**
   * Main nugget text (1–2 sentences).
   */
  @Column({ type: 'text', nullable: false })
  body: string;

  /**
   * Required target audience (community).
   * Use this to segment push notifications/feeds.
   */
  @Column({
    type: 'enum',
    enum: NuggetType,
    default: NuggetType.GENERAL,
    nullable: false,
  })
  nuggetType: NuggetType;

  /**
   * Attribution shown when shared (FR-38b), e.g. “via Agudah App”.
   */
  @Column({ length: 120, nullable: true })
  sourceAttribution: string | null;

  /**
   * Optional planned publish date/time (used by the daily push job).
   */
  @Index('idx_nugget_publish_at')
  @Column({ type: 'timestamp', nullable: true })
  publishAt: Date | null;

  /**
   * Mark if the push for this nugget has been sent already.
   */
  @Column({ type: 'boolean', default: false })
  pushed: boolean;

  /**
   * Admin creator (nullable as requested).
   * You can later convert to a FK to your AdminUser entity.
   */
  @ManyToOne(() => AdminEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'adminId' }) // TypeORM will create adminId for you; no explicit FK field required
  admin: AdminEntity | null;

  /**
   * Soft on/off; helpful for moderation/rollbacks.
   */
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  /**
   * Lightweight counters to avoid heavy joins for simple feeds.
   * Keep in sync via triggers/service updates.
   */
  @Column({ type: 'int', default: 0 })
  likeCount: number;

  @Column({ type: 'int', default: 0 })
  commentCount: number;

  @Column({ type: 'int', default: 0 })
  shareCount: number;

  /**
   * Relations for likes & comments (FR-38a, FR-38c).
   * These entities will hold who liked/commented and moderation status.
   */
  @OneToMany(() => NuggetCommentEntity, (c) => c.nugget, { cascade: true })
  comments: NuggetCommentEntity[];

  @OneToMany(() => NuggetLikeEntity, (l) => l.nugget, { cascade: true })
  likes: NuggetLikeEntity[];
}
