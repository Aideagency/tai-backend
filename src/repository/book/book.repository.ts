// src/repository/books/book.repository.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../base.repository';
import { BookEntity } from 'src/database/entities/book.entity';
import {
  OwnershipStatus,
  UserBookDownloadEntity,
} from 'src/database/entities/user-book-download.entity';
import { BooksQueryDto } from 'src/books/dtos/books-query.dto';

@Injectable()
export class BookRepository extends BaseRepository<
  BookEntity,
  Repository<BookEntity>
> {
  protected logger = new Logger(BookRepository.name);

  constructor(
    @InjectRepository(BookEntity) repo: Repository<BookEntity>,
    @InjectRepository(UserBookDownloadEntity)
    private readonly downloadRepo: Repository<UserBookDownloadEntity>,
  ) {
    super(repo);
  }

  private baseQB(params: BooksQueryDto, userId?: number) {
    const qb = this.query('b');

    // user-aware join (adds download info)
    if (userId) {
      qb.leftJoin(
        UserBookDownloadEntity,
        'ubd',
        'ubd.bookId = b.id AND ubd.userId = :userId AND ubd.isActive = true',
        { userId },
      );
      qb.addSelect('ubd.id', 'ubd_id');
      qb.addSelect('ubd.downloadedAt', 'ubd_downloadedAt');
    }

    if (params.publishedOnly) qb.andWhere('b.isPublished = true');

    if (params.q) {
      const q = `%${params.q.toLowerCase()}%`;
      qb.andWhere(
        `(LOWER(b.title) ILIKE :q OR LOWER(b.author) ILIKE :q OR LOWER(b.slug) ILIKE :q)`,
        { q },
      );
    }

    if (params.ownershipType)
      qb.andWhere('b.ownershipType = :ot', { ot: params.ownershipType });
    if (params.accessType)
      qb.andWhere('b.accessType = :at', { at: params.accessType });

    if (params.downloadedOnly && userId) {
      qb.andWhere('ubd.id IS NOT NULL');
    }

    const orderBy = params.orderBy ?? 'createdAt';
    const orderDir = params.orderDir ?? 'DESC';
    qb.orderBy(`b.${orderBy}`, orderDir);

    return qb;
  }

  /**
   * List books for a user, returning `isDownloaded` + `downloadedAt`.
   */
  async searchPaginatedForUser(params: BooksQueryDto, userId: number) {
    const page = Math.max(params.page ?? 1, 1);
    const pageSize = Math.max(params.pageSize ?? 10, 1);

    const qb = this.baseQB(params, userId);

    // Use your BaseRepository paginate if it supports QB (like your UserRepository example)
    const result = await this.paginate(
      { page, limit: pageSize },
      {},
      { id: 'DESC' },
      {},
      qb,
    );

    // Map the raw join selection into flags (isDownloaded/downloadedAt)
    // Base paginate usually returns entities only; so we fetch raw alongside for flags.
    // To keep it simple, we re-run as raw+entities for the current page:
    const { entities, raw } = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getRawAndEntities();

    const items = entities.map((b, i) => ({
      ...this.toPublic(b),
      isDownloaded: !!raw[i]?.ubd_id,
      downloadedAt: raw[i]?.ubd_downloadedAt ?? null,
    }));

    return {
      ...result,
      items,
    };
  }

  /**
   * Get a single book with user ownership flag.
   */
  async findOneForUserOrFail(bookId: number, userId: number) {
    const qb = this.baseQB({ publishedOnly: false }, userId).andWhere(
      'b.id = :id',
      { id: bookId },
    );

    const { entities, raw } = await qb.getRawAndEntities();
    const book = entities?.[0];
    if (!book) throw new NotFoundException('Book not found');

    return {
      ...this.toPublic(book),
      isDownloaded: !!raw?.[0]?.ubd_id,
      downloadedAt: raw?.[0]?.ubd_downloadedAt ?? null,
    };
  }

  async recordDownload({
    userId,
    bookId,
    paymentRef,
    status,
  }: {
    userId: number;
    bookId: number;
    paymentRef?: string;
    status: OwnershipStatus;
  }) {
    // upsert behavior (avoid duplicates)
    const existing = await this.downloadRepo.findOne({
      where: { userId, bookId },
    });

    if (existing) {
      existing.isActive = true;
      existing.paymentRef = paymentRef ?? existing.paymentRef;
      existing.downloadedAt = new Date();
      existing.status = status;
      return this.downloadRepo.save(existing);
    }

    return this.downloadRepo.save(
      this.downloadRepo.create({
        userId,
        bookId,
        paymentRef: paymentRef ?? null,
        status,
      }),
    );
  }

  async getUserDownloads(userId: number) {
    const downloads = await this.downloadRepo.find({
      where: { userId, isActive: true },
      relations: { book: true },
      order: { downloadedAt: 'DESC' },
    });

    return downloads.map((d) => ({
      ...this.toPublic(d.book),
      isDownloaded: true,
      downloadedAt: d.downloadedAt,
    }));
  }

  toPublic(book: BookEntity) {
    if (!book) return null;

    const {
      id,
      slug,
      title,
      author,
      description,
      coverImageUrl,
      ownershipType,
      accessType,
      price,
      currency,
      externalUrl,
      pdfUrl,
      isPublished,
      createdAt,
      updatedAt,
    } = book;

    return {
      id,
      slug,
      title,
      author,
      description,
      coverImageUrl,
      ownershipType,
      accessType,
      price,
      currency,
      externalUrl,
      pdfUrl, // you may want to hide this until "owned" in service/controller
      isPublished,
      createdAt,
      updatedAt,
    };
  }

  async saveDownload(download: UserBookDownloadEntity) {
    return this.downloadRepo.save(download);
  }

  async findDownloadByTransactionRef(transactionRef: string) {
    const ref = (transactionRef || '').trim();
    if (!ref) {
      throw new NotFoundException('Transaction reference is required');
    }

    const download = await this.downloadRepo
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.book', 'book')
      .leftJoinAndSelect('d.user', 'user')
      .where('d.paymentRef = :ref', { ref })
      .andWhere('d.isActive = true')
      .getOne();

    if (!download) {
      throw new NotFoundException(
        'Book download not found for the given transaction reference',
      );
    }

    return download;
  }
}
