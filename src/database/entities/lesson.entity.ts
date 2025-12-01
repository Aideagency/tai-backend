import { Column, Entity, ManyToOne } from 'typeorm';
import { CustomEntity } from './custom.entity';
import { CourseEntity } from './course.entity';

export enum LessonType {
  VIDEO = 'VIDEO',
  PDF = 'PDF',
  ARTICLE = 'ARTICLE',
  QUIZ = 'QUIZ',
}

@Entity({ name: 'Lessons' })
export class LessonEntity extends CustomEntity {
  @ManyToOne(() => CourseEntity, (course) => course.lessons)
  course: CourseEntity;

  @Column()
  courseId: string; // FK to CourseEntity.id

  @Column()
  zoho_file_id: string; // from Zoho `getCourseResources`

  @Column()
  title: string;

  @Column({ type: 'enum', enum: LessonType, default: LessonType.VIDEO })
  type: LessonType;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ type: 'int', nullable: true })
  estimatedDurationSeconds: number | null;

  // if you cache/download file to your own storage:
  @Column({ nullable: true })
  localUrl: string;
}
