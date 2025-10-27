import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { CustomEntity } from './custom.entity';
import { UserEntity } from './user.entity';

export enum FollowStatus {
  ACCEPTED = 'ACCEPTED', // default for public accounts
  PENDING = 'PENDING', // for private accounts (optional)
  BLOCKED = 'BLOCKED', // if you add blocking later
}

@Entity({ name: 'user_follows' })
export class FollowEntity extends CustomEntity {
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'follower_id' })
  follower: UserEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'followee_id' })
  followee: UserEntity;

  @Column({ type: 'enum', enum: FollowStatus, default: FollowStatus.ACCEPTED })
  status: FollowStatus;

  // optional: soft delete / mute / notes
  @Column({ type: 'boolean', default: false })
  isDeleted: boolean;

  @Index()
  @Column({ type: 'timestamptz', default: () => 'now()' })
  created_at: Date;
}
