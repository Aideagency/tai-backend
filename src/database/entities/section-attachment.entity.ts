// src/database/entities/section-attachment.entity.ts
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { CustomEntity } from './custom.entity';
import { LessonSectionEntity } from './lesson-section.entity';

@Entity({ name: 'section_attachments' })
@Index(['sectionId'])
export class SectionAttachmentEntity extends CustomEntity {
  @ManyToOne(() => LessonSectionEntity, (section) => section.attachments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'section_id' })
  section: LessonSectionEntity;

  @Column({ name: 'section_id' })
  sectionId: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 2000 })
  url: string;

  @Column({ type: 'varchar', length: 500 })
  publicId: string;

  @Column({ type: 'varchar', length: 50 })
  resourceType: string; // 'image' | 'raw'

  @Column({ type: 'varchar', length: 100, nullable: true })
  mimeType: string | null;

  @Column({ type: 'bigint', nullable: true })
  sizeBytes: number | null;
}
