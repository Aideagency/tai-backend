// src/database/entities/user-book-download.entity.ts
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { CustomEntity } from './custom.entity';
import { UserEntity } from './user.entity';
import { BookEntity } from './book.entity';

export enum OwnershipStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  CONFIRMED = 'CONFIRMED', // RSVP successful or payment confirmed
  CANCELLED = 'CANCELLED',
}

@Entity({ name: 'UserBookDownloads' })
@Index(['userId', 'bookId'], { unique: true }) // one record per user per book
export class UserBookDownloadEntity extends CustomEntity {
  @Column()
  userId: number;

  @Column()
  bookId: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @ManyToOne(() => BookEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bookId' })
  book: BookEntity;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  downloadedAt: Date;

  // Optional: if PAID, you can store refs here
  @Index(['paymentRef'], { unique: true, where: `"paymentRef" IS NOT NULL` })
  @Column({ nullable: true })
  paymentRef: string;

  @Column({
    type: 'enum',
    enum: OwnershipStatus,
    enumName: 'user_book_download_status_enum', // any name you like
    default: OwnershipStatus.PENDING_PAYMENT, // optional but usually useful
  })
  status: OwnershipStatus;

  @Column({ default: true })
  isActive: boolean; // in case you ever want to revoke access without deleting
}
