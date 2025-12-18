import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { CustomEntity } from './custom.entity';
import { CourseEntity } from './course.entity';

export enum ZohoLessonType {
  CHAPTER = 'CHAPTER',
  DOCUMENT = 'DOCUMENT',
  ASSIGNMENT = 'ASSIGNMENT',
  QUIZ = 'QUIZ',
  VIDEO = 'VIDEO',
  ARTICLE = 'ARTICLE',
}

export enum LessonStatus {
  ACTIVE = 'ACTIVE',
  UNPUBLISHED = 'UNPUBLISHED',
  INACTIVE = 'INACTIVE',
}

@Entity({ name: 'lessons' })
@Index(['course', 'zohoLessonId'], { unique: true })
export class LessonEntity extends CustomEntity {
  @ManyToOne(() => CourseEntity, (course) => course.lessons, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'course_id' })
  course: CourseEntity;

  @Column({ name: 'zoho_lesson_id' })
  zohoLessonId: string; // Zoho: lesson.id (works for CHAPTER + child lessons)

  @Column({ name: 'zoho_parent_id', nullable: true })
  zohoParentId: string | null; // Zoho: parentId (null for CHAPTER)

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  slug: string | null; // Zoho: url

  @Column({ type: 'enum', enum: ZohoLessonType })
  zohoType: ZohoLessonType; // Zoho: type

  @Column({ type: 'enum', enum: LessonStatus, default: LessonStatus.ACTIVE })
  status: LessonStatus;

  @Column({ type: 'int', default: 0 })
  sortOrder: number; // Zoho: order (convert string -> number)

  @Column({ type: 'int', nullable: true })
  estimatedDurationSeconds: number | null;

  @Column({ type: 'json', nullable: true })
  zohoMeta: any | null; // lessonMeta etc.

  @Column({ type: 'timestamptz', nullable: true })
  zohoModifiedAt: Date | null; // from modifiedTime epoch ms
}
