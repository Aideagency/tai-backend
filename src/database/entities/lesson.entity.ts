import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { CustomEntity } from './custom.entity';
import { CourseEntity } from './course.entity';
import { LessonAttachmentEntity } from './lesson-attachment.entity';

@Entity({ name: 'lessons' })
@Index(['courseId', 'sortOrder'], { unique: true }) // ✅ enforce coherent ordering
export class LessonEntity extends CustomEntity {
  @ManyToOne(() => CourseEntity, (course) => course.lessons, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'course_id' })
  course: CourseEntity;

  @Column({ name: 'course_id' })
  courseId: number;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  descriptionHtml: string | null; // ✅ rich text (HTML string)

  @Column({ type: 'varchar', nullable: true })
  youtubeUrl: string | null;

  @Column({ type: 'int' })
  sortOrder: number;

  @OneToMany(() => LessonAttachmentEntity, (attachment) => attachment.lesson)
  attachments: LessonAttachmentEntity[];
}
