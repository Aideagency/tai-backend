import { Column, Entity, OneToMany, Index, ManyToOne } from 'typeorm';
import { CustomEntity } from './custom.entity';
import { LessonEntity } from './lesson.entity';
// import { UserCourseProgressEntity } from './user-course-progress.entity';

export enum PublishStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

@Entity({ name: 'courses' })
export class CourseEntity extends CustomEntity {
  @Column({ type: 'varchar', length: 180 })
  title: string;

  @Column({ type: 'text', nullable: true })
  descriptionHtml: string | null;

  @Column({ type: 'varchar', nullable: true })
  thumbnailUrl: string | null;

  @Column({ type: 'varchar', nullable: true })
  thumbnailPublicId: string | null;

  @Column({ type: 'varchar', nullable: true })
  thumbnailResourceType: string | null;

  @Column({ type: 'boolean', default: true })
  isFree: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price: number | null;

  @Column({ type: 'varchar', length: 8, default: 'NGN' })
  currency: string;

  @Column({
    type: 'enum',
    enum: PublishStatus,
    default: PublishStatus.DRAFT,
  })
  status: PublishStatus;

  @OneToMany(() => LessonEntity, (lesson) => lesson.course)
  lessons: LessonEntity[];
}
