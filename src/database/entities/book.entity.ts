import { Column, Entity, BeforeInsert, BeforeUpdate } from 'typeorm';
import { CustomEntity } from './custom.entity';

export enum BookOwnershipType {
  IN_HOUSE = 'IN_HOUSE',
  EXTERNAL = 'EXTERNAL',
}

export enum BookAccessType {
  FREE = 'FREE',
  PAID = 'PAID',
}

function slugify(text = '') {
  return text
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

@Entity({ name: 'Books' })
export class BookEntity extends CustomEntity {
  @Column({ unique: true })
  slug: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  author: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  coverImageUrl: string;

  @Column({ nullable: true })
  coverImagePublicId: string;

  @Column({
    type: 'enum',
    enum: BookOwnershipType,
    default: BookOwnershipType.IN_HOUSE,
  })
  ownershipType: BookOwnershipType;

  @Column({
    type: 'enum',
    enum: BookAccessType,
    nullable: true,
  })
  accessType: BookAccessType | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price: number | null;

  @Column({ default: 'NGN' })
  currency: string;

  @Column({ type: 'text', nullable: true })
  pdfUrl: string | null;

  @Column({ nullable: true })
  pdfPublicId: string;

  @Column({ type: 'text', nullable: true })
  externalUrl: string | null;

  @Column({ default: true })
  isPublished: boolean;

  @Column({ nullable: true })
  publishDate: string;

  @Column({ nullable: true })
  isbn: string;

  @BeforeInsert()
  setSlugOnInsert() {
    if (!this.slug) {
      // add a small suffix to reduce collisions
      const suffix = Math.random().toString(36).slice(2, 7);
      this.slug = `${slugify(this.title)}-${suffix}`;
    }
  }

  @BeforeUpdate()
  setSlugOnUpdate() {
    // optional: if slug is missing for any reason
    if (!this.slug && this.title) {
      const suffix = Math.random().toString(36).slice(2, 7);
      this.slug = `${slugify(this.title)}-${suffix}`;
    }
  }
}
