import { Entity, Column, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { CustomEntity } from './custom.entity';
import { UserEntity } from './user.entity';
import { PrayerWallEntity } from './prayer-wall.entity';

export enum PrayerAmenReaction {
  AMEN = 'AMEN',
  STRONG_AMEN = 'STRONG_AMEN',
}

@Entity({ name: 'prayer_amens' })
@Unique('uq_prayer_user', ['prayer', 'user']) // one reaction per user per prayer
export class PrayerAmenEntity extends CustomEntity {
  @ManyToOne(() => PrayerWallEntity, (p) => p.amens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'prayer_id' })
  @Index('idx_prayer_amen_prayer_id')
  prayer: PrayerWallEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  @Index('idx_prayer_amen_user_id')
  user: UserEntity;

  @Column({
    type: 'enum',
    enum: PrayerAmenReaction,
    default: PrayerAmenReaction.AMEN,
  })
  reaction: PrayerAmenReaction;
}
