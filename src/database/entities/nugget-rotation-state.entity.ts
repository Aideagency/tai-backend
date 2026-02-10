import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { NuggetType } from './nugget.entity';

@Entity({ name: 'nugget_rotation_state' })
@Index('ux_rotation_state_type', ['nuggetType'], { unique: true })
export class NuggetRotationStateEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: NuggetType, nullable: false })
  nuggetType: NuggetType;

  @Column({ type: 'int', default: 0 })
  lastNuggetId: number;

  @Column({ type: 'varchar', length: 10, nullable: true })
  lastDateKey: string | null;
}
