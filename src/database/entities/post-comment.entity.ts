import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { CustomEntity } from './custom.entity';
import { PostEntity } from './post.entity';
import { UserEntity } from './user.entity';

@Entity({ name: 'post_comments' })
export class PostCommentEntity extends CustomEntity {
  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @ManyToOne(() => PostEntity, (post) => post.comments, { nullable: false })
  @JoinColumn({ name: 'postId' })
  post: PostEntity;

  @Column({ type: 'text', nullable: false })
  body: string;
}
