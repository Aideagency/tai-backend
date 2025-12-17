// src/modules/books/admin-books.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  BookEntity,
  BookAccessType,
  BookOwnershipType,
} from 'src/database/entities/book.entity';
import { UserBookDownloadEntity } from 'src/database/entities/user-book-download.entity';
import { CreateBookDto } from './dtos/create-book.dto';
import { UpdateBookDto } from './dtos/update-book.dto';
import { BookRepository } from 'src/repository/book/book.repository';
import { CloudinaryService } from 'src/infrastructure/cloudinary/cloudinary.service';

@Injectable()
export class AdminBooksService {
  constructor(
    private readonly bookRepo: BookRepository,
    private readonly cloudinary: CloudinaryService,
  ) {}

  // ---------- helpers ----------
  private validateCreateOrUpdate(dto: Partial<CreateBookDto>) {
    // Ownership rules
    if (dto.ownershipType === BookOwnershipType.EXTERNAL) {
      if (!dto.externalUrl) {
        throw new BadRequestException(
          'externalUrl is required when ownershipType is EXTERNAL',
        );
      }
      // for external books, these are irrelevant
      // (you can choose to allow them, but most teams null them to avoid confusion)
    }

    if (dto.ownershipType === BookOwnershipType.IN_HOUSE) {
      if (!dto.pdfFile) {
        throw new BadRequestException(
          'pdfUrl is required when ownershipType is IN_HOUSE',
        );
      }
      if (!dto.accessType) {
        throw new BadRequestException(
          'accessType is required when ownershipType is IN_HOUSE',
        );
      }
      if (dto.accessType === BookAccessType.PAID) {
        if (dto.price == null || Number(dto.price) <= 0) {
          throw new BadRequestException(
            'price is required and must be > 0 when accessType is PAID',
          );
        }
        // if (!dto.currency) {
        //   throw new BadRequestException(
        //     'currency is required when accessType is PAID',
        //   );
        // }
      }
    }
  }

  // ---------- CRUD ----------
  async createBook(
    dto: CreateBookDto,
    files?: {
      coverImage?: Express.Multer.File;
      pdfFile?: Express.Multer.File;
    },
  ) {
    let coverImage;
    let pdf;

    if (files?.coverImage) {
      coverImage = await this.cloudinary.uploadFile(files.coverImage, {
        folder: 'books/covers',
        resourceType: 'image',
      });
    }

    if (files?.pdfFile && dto.ownershipType === BookOwnershipType.IN_HOUSE) {
      pdf = await this.cloudinary.uploadFile(files.pdfFile, {
        folder: 'books/pdfs',
        resourceType: 'raw', // important for PDFs
      });
    }

    const book = new BookEntity();
    Object.assign(book, dto);
    book.coverImageUrl = coverImage?.url ?? null;
    book.coverImagePublicId = coverImage?.publicId ?? null;
    book.pdfUrl = pdf?.url ?? null;
    book.pdfPublicId = pdf?.publicId ?? null;

    console.log(book)

    return this.bookRepo.save(book);
  }

  async updateBook(
    id: number,
    dto: UpdateBookDto,
    files?: {
      coverImage?: Express.Multer.File;
      pdfFile?: Express.Multer.File;
    },
  ) {
    const book = await this.bookRepo.findOne({ id });
    if (!book) throw new NotFoundException('Book not found');

    // Replace cover image
    if (files?.coverImage) {
      if (book.coverImagePublicId) {
        await this.cloudinary.deleteFile(book.coverImagePublicId, 'image');
      }

      const cover = await this.cloudinary.uploadFile(files.coverImage, {
        folder: 'books/covers',
      });

      book.coverImageUrl = cover.url;
      book.coverImagePublicId = cover.publicId;
    }

    // Replace PDF
    if (files?.pdfFile) {
      if (book.pdfPublicId) {
        await this.cloudinary.deleteFile(book.pdfPublicId, 'raw');
      }

      const pdf = await this.cloudinary.uploadFile(files.pdfFile, {
        folder: 'books/pdfs',
        resourceType: 'raw',
      });

      book.pdfUrl = pdf.url;
      book.pdfPublicId = pdf.publicId;
    }

    Object.assign(book, dto);
    return this.bookRepo.save(book);
  }

  async getBookAdmin(bookId: number, includeDownloads = true) {
    // const book = await this.bookRepo.findOne({ where: { id: bookId } });
    // if (!book) throw new NotFoundException('Book not found');
    // if (!includeDownloads) return book;
    // const downloads = await this.downloadRepo.find({
    //   where: { bookId },
    //   relations: { user: true },
    //   order: { downloadedAt: 'DESC' },
    // });
    // return {
    //   ...book,
    //   downloads: downloads.map((d) => ({
    //     id: d.id,
    //     userId: d.userId,
    //     userEmail: d.user?.email_address ?? null,
    //     status: d.status,
    //     isActive: d.isActive,
    //     paymentRef: d.paymentRef ?? null,
    //     downloadedAt: d.downloadedAt,
    //   })),
    //   downloadStats: {
    //     total: downloads.length,
    //     active: downloads.filter((d) => d.isActive).length,
    //   },
    // };
  }

  async listBooksAdmin(options?: { q?: string; publishedOnly?: boolean }) {
    // const qb = this.bookRepo.createQueryBuilder('b');
    // if (options?.publishedOnly) qb.andWhere('b.isPublished = true');
    // if (options?.q) {
    //   const q = `%${options.q.toLowerCase()}%`;
    //   qb.andWhere(
    //     `(LOWER(b.title) ILIKE :q OR LOWER(b.author) ILIKE :q OR LOWER(b.slug) ILIKE :q)`,
    //     { q },
    //   );
    // }
    // qb.orderBy('b.createdAt', 'DESC');
    // const books = await qb.getMany();
    // return books;
  }

  // ---------- Admin downloads / access control ----------
  async listBookDownloads(bookId: number) {
    // ensures book exists
    const exists = await this.bookRepo.findOne({ id: bookId });
    if (!exists) throw new NotFoundException('Book not found');

    // const downloads = await this.downloadRepo.find({
    //   where: { bookId },
    //   relations: { user: true },
    //   order: { downloadedAt: 'DESC' },
    // });

    // return downloads.map((d) => ({
    //   id: d.id,
    //   bookId: d.bookId,
    //   userId: d.userId,
    //   userEmail: d.user?.email_address ?? null,
    //   status: d.status,
    //   isActive: d.isActive,
    //   paymentRef: d.paymentRef ?? null,
    //   downloadedAt: d.downloadedAt,
    // }));
  }

  async revokeBookAccess(bookId: number, userId: number) {
    // const download = await this.downloadRepo.findOne({
    //   where: { bookId, userId, isActive: true },
    // });
    // if (!download) {
    //   throw new NotFoundException('Active download record not found to revoke');
    // }
    // download.isActive = false;
    // return this.downloadRepo.save(download);
  }
}
