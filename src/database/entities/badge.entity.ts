import { Column, Entity } from 'typeorm';
import { CustomEntity } from './custom.entity';

@Entity({ name: 'Badges' })
export class BadgeEntity extends CustomEntity {
  @Column({ unique: true, nullable: true })
  code: string; // e.g., SELF_DISCOVERY_CHAMPION

  @Column({ nullable: false })
  name: string; // display name

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  iconUrl: string;
}
