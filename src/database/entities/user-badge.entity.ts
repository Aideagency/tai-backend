import { Column, Entity, ManyToOne, OneToMany, Index } from 'typeorm';
import { CustomEntity } from './custom.entity';
import { UserEntity } from './user.entity';
import { BadgeEntity } from './badge.entity';

@Entity({ name: 'UserBadges' })
@Index(['user', 'badge'], { unique: true })
export class UserBadgeEntity extends CustomEntity {
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  user: UserEntity;

  @ManyToOne(() => BadgeEntity, { onDelete: 'CASCADE' })
  badge: BadgeEntity;

  @Column({ type: 'timestamp', nullable: true })
  awardedAt: Date | null;

  @Column({ nullable: true })
  awardedForChallengeId: string | null; // optional backref
}
