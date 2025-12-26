import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { CustomEntity } from './custom.entity';
import { LessonEntity } from './lesson.entity';
import { LessonAttachmentEntity } from './lesson-attachment.entity';

@Entity({ name: 'lesson_sections' })
@Index(['lessonId', 'sortOrder'])
export class LessonSectionEntity extends CustomEntity {
  // @ManyToOne(() => LessonEntity, (lesson) => lesson.sections, {
  //   onDelete: 'CASCADE',
  // })
  // @JoinColumn({ name: 'lesson_id' })
  // lesson: LessonEntity;

  @Column({ name: 'lesson_id' })
  lessonId: number;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  contentHtml: string | null; // rich text (HTML)

  @Column({ type: 'varchar', nullable: true })
  youtubeUrl: string | null;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @OneToMany(() => LessonAttachmentEntity, (att) => att.lesson)
  attachments: LessonAttachmentEntity[];
}
