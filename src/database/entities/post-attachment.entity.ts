import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { CustomEntity } from './custom.entity';
import { PostEntity } from './post.entity';

export enum PostAttachmentType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
  LINK = 'LINK',
  OTHER = 'OTHER',
}

@Entity({ name: 'post_attachments' })
export class PostAttachmentEntity extends CustomEntity {
  @ManyToOne(() => PostEntity, (post) => post.attachments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'postId' })
  post: PostEntity;

  @Column({ name: 'postId' })
  postId: number;

  @Column({
    type: 'enum',
    enum: PostAttachmentType,
    enumName: 'post_attachments_type_enum',
  })
  type: PostAttachmentType;

  @Column({ type: 'varchar', length: 2000 })
  url: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  publicId: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  mimeType: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  resourceType: string | null;

  @Column({ type: 'bigint', nullable: true })
  sizeBytes: number | null;
}
