import {
  Column,
  Entity,
  OneToMany,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CustomEntity } from './custom.entity';
// Import related entities
import { PostCommentEntity } from './post-comment.entity';
import { PostLikeEntity } from './post-like.entity';
import { PostShareEntity } from './post-share.entity';
import { UserEntity } from './user.entity';

@Entity({ name: 'posts' })
export class PostEntity extends CustomEntity {
  /**
   * Title of the post, optional for a more flexible approach
   */
  @Column({ length: 255, nullable: true })
  title: string | null;

  /**
   * Main body content of the post, can be long text for social media-style posts.
   */
  @Column({ type: 'text', nullable: false })
  body: string;

  /**
   * Optional URL link (e.g., for sharing links or embedded content like YouTube).
   */
  @Column({ type: 'varchar', length: 512, nullable: true })
  link: string | null;

  /**
   * The user who posted it, this will be a foreign key.
   */
  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  /**
   * Optional planned publish date/time.
   */
  @Index('idx_post_publish_at')
  @Column({ type: 'timestamp', nullable: true })
  publishAt: Date | null;

  /**
   * To mark if the post is active or deleted for moderation purposes
   */
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  /**
   * Lightweight counters to track engagement
   */
  @Column({ type: 'int', default: 0 })
  likeCount: number;

  @Column({ type: 'int', default: 0 })
  commentCount: number;

  @Column({ type: 'int', default: 0 })
  shareCount: number;

  /**
   * Relations for likes, comments, and shares
   * These entities will handle who liked, commented, and shared the post
   */
  @OneToMany(() => PostCommentEntity, (c) => c.post, { cascade: true })
  comments: PostCommentEntity[];

  @OneToMany(() => PostLikeEntity, (l) => l.post, { cascade: true })
  likes: PostLikeEntity[];

  @OneToMany(() => PostShareEntity, (s) => s.post, { cascade: true })
  shares: PostShareEntity[];
}
