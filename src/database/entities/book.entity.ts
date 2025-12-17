import { Column, Entity } from 'typeorm';
import { CustomEntity } from './custom.entity';

export enum BookOwnershipType {
  IN_HOUSE = 'IN_HOUSE', // we host the PDF
  EXTERNAL = 'EXTERNAL', // we only link out
}

export enum BookAccessType {
  FREE = 'FREE',
  PAID = 'PAID',
}

@Entity({ name: 'Books' })
export class BookEntity extends CustomEntity {
  @Column({ unique: true })
  slug: string; // e.g. "the-meaning-of-marriage" (useful for routing)

  @Column()
  title: string; // "The Meaning of Marriage"

  @Column({ nullable: true })
  author: string; // "Timothy Keller"

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  coverImageUrl: string; // book cover image

  @Column({ nullable: true })
  coverImagePublicId: string;

  @Column({
    type: 'enum',
    enum: BookOwnershipType,
    default: BookOwnershipType.IN_HOUSE,
  })
  ownershipType: BookOwnershipType;

  /**
   * IN_HOUSE books can be FREE or PAID (downloadable PDF).
   * EXTERNAL books should leave accessType/price/pdfUrl null and use externalUrl.
   */
  @Column({
    type: 'enum',
    enum: BookAccessType,
    nullable: true,
  })
  accessType: BookAccessType | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price: number | null; // only relevant when ownershipType=IN_HOUSE and accessType=PAID

  @Column({ default: 'NGN' })
  currency: string; // "NGN" to match ₦ display

  @Column({ type: 'text', nullable: true })
  pdfUrl: string | null; // in-house PDF location (S3/Cloudinary/local path)

  @Column({ nullable: true })
  pdfPublicId: string;

  @Column({ type: 'text', nullable: true })
  externalUrl: string | null; // where users can get the book externally

  @Column({ default: true })
  isPublished: boolean;

  @Column({ nullable: true })
  publishDate: string; // optional (or use Date type if you prefer)

  @Column({ nullable: true })
  isbn: string; // optional
}
