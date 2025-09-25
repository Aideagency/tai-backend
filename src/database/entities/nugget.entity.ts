// nugget.entity.ts
import { Entity, Column, ManyToOne, Index, Unique } from 'typeorm';
import { CustomEntity } from './custom.entity';
import { UserEntity } from './user.entity';

export enum NuggetType {
  DAILY = 'DAILY',
  CHALLENGE_TIP = 'CHALLENGE_TIP',
}

@Entity('nuggets')
@Unique(['type', 'scheduled_for']) // <= one DAILY per date
export class NuggetEntity extends CustomEntity {
  @Column({ type: 'enum', enum: NuggetType, default: NuggetType.DAILY })
  type: NuggetType;

  @Column({ length: 160, nullable: true })
  title?: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ nullable: true })
  media_url?: string;

  // Store canonical date string in Africa/Lagos
  @Index()
  @Column({ type: 'date', nullable: true })
  scheduled_for?: string; // 'YYYY-MM-DD'

  @Column({ default: true })
  is_published: boolean;

  // explicit global marker (handy if you later add user/segment scoping)
  @Column({ default: true })
  is_global: boolean;

  @ManyToOne(() => UserEntity, { nullable: true })
  author?: UserEntity;
}
