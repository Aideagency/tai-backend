import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { CustomEntity } from './custom.entity';
import { LessonEntity } from './lesson.entity';

export enum AttachmentType {
  PDF = 'PDF',
  IMAGE = 'IMAGE',
  DOC = 'DOC',
  LINK = 'LINK',
  OTHER = 'OTHER',
}

@Entity({ name: 'lesson_attachments' })
export class LessonAttachmentEntity extends CustomEntity {
  @ManyToOne(() => LessonEntity, (lesson) => lesson.attachments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'lesson_id' })
  lesson: LessonEntity;

  @Column({ name: 'lesson_id' })
  lessonId: number;

  @Column()
  title: string;

  @Column({ type: 'enum', enum: AttachmentType, default: AttachmentType.OTHER })
  type: AttachmentType;

  @Column()
  url: string; // cloudinary secure_url or external link

  @Column({ nullable: true })
  publicId: string | null; // for cloudinary delete/replace

  @Column({ default: 'raw' })
  resourceType: 'image' | 'raw';

  @Column({ type: 'int', nullable: true })
  sizeBytes: number | null;
}
