import {
  Column,
  Entity,
  Index,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { NuggetEntity, NuggetType } from './nugget.entity';

@Entity({ name: 'daily_nuggets' })
@Index('ux_daily_nuggets_date_type', ['dateKey', 'nuggetType'], {
  unique: true,
})
export class DailyNuggetEntity {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Date key in YYYY-MM-DD (consistent timezone choice).
   * Store as string so comparisons are simple and index-friendly.
   */
  @Column({ type: 'varchar', length: 10 })
  dateKey: string;

  @Column({
    type: 'enum',
    enum: NuggetType,
    nullable: false,
  })
  nuggetType: NuggetType;

  @Column({ type: 'int', nullable: false })
  nuggetId: number;

  @ManyToOne(() => NuggetEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'nuggetId' })
  nugget: NuggetEntity;
}
