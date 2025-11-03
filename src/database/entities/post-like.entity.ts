import { Entity, ManyToOne, JoinColumn, Column } from 'typeorm';
import { CustomEntity } from './custom.entity';
import { PostEntity } from './post.entity';
import { UserEntity } from './user.entity';

@Entity({ name: 'post_likes' })
export class PostLikeEntity extends CustomEntity {
  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @ManyToOne(() => PostEntity, (post) => post.likes, { nullable: false })
  @JoinColumn({ name: 'postId' })
  post: PostEntity;
}
