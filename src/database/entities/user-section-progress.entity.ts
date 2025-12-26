import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { CustomEntity } from './custom.entity';
import { LessonSectionEntity } from './lesson-section.entity';

export enum ProgressState {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

@Entity({ name: 'user_section_progress' })
@Index(['userId', 'sectionId'], { unique: true })
export class UserSectionProgressEntity extends CustomEntity {
  @Column()
  userId: number;

  @Column()
  sectionId: number;

  @ManyToOne(() => LessonSectionEntity, { onDelete: 'CASCADE' })
  section: LessonSectionEntity;

  @Column({
    type: 'enum',
    enum: ProgressState,
    default: ProgressState.NOT_STARTED,
  })
  status: ProgressState;

  @Column({ type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  // auto-progress fields
  @Column({ type: 'int', nullable: true })
  lastPositionSeconds: number | null;

  @Column({ type: 'int', nullable: true })
  totalWatchedSeconds: number | null;

  // manual override
  @Column({ default: false })
  manuallyCompleted: boolean;
}
