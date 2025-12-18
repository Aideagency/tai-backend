// src/modules/books/books.service.ts
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BookOwnershipType,
  BookAccessType,
} from 'src/database/entities/book.entity';
import { BookRepository } from 'src/repository/book/book.repository';
import { BooksQueryDto } from './dtos/books-query.dto';
import {
  PaidFor,
  TransactionEntity,
} from 'src/database/entities/transaction.entity';
import { PaymentService } from 'src/payment/payment.service';
import { TransactionRepository } from 'src/repository/transaction/transaction.repository';
import { OwnershipStatus } from 'src/database/entities/user-book-download.entity';
import { EmailService } from 'src/infrastructure/communication/email/email.service';
import { TracerLogger } from 'src/logger/logger.service';

@Injectable()
export class BooksService {
  constructor(
    private readonly booksRepo: BookRepository,
    @Inject(forwardRef(() => PaymentService))
    private readonly paymentService: PaymentService,
    private readonly transactionRepo: TransactionRepository,
    private readonly emailService: EmailService,
    private readonly logger: TracerLogger,
  ) {}

  async listBooks(query: BooksQueryDto, userId: number) {
    return this.booksRepo.searchPaginatedForUser(query, userId);
  }

  async myDownloads(userId: number) {
    return this.booksRepo.getUserDownloads(userId);
  }

  async getBook(bookId: number, userId: number) {
    const book = await this.booksRepo.findOneForUserOrFail(bookId, userId);

    // Optionally hide pdfUrl unless downloaded OR free in-house
    if (book.ownershipType === BookOwnershipType.IN_HOUSE) {
      const isFree = book.accessType === BookAccessType.FREE;
      if (!book.isDownloaded && !isFree) {
        return { ...book, pdfUrl: null };
      }
    }

    // External books never expose pdfUrl
    if (book.ownershipType === BookOwnershipType.EXTERNAL) {
      return { ...book, pdfUrl: null };
    }

    return book;
  }

  async downloadBook(bookId: number, req: any) {
    const book = await this.booksRepo.findOne({ id: bookId });
    if (!book) throw new NotFoundException('Book not found');

    if (book.ownershipType === BookOwnershipType.EXTERNAL) {
      throw new BadRequestException(
        'This is an external book. Use externalUrl.',
      );
    }

    if (book.accessType === BookAccessType.PAID) {
      const transaction = new TransactionEntity();
      const paymentResponse = await this.paymentService.initializePayment({
        email: req.user.email,
        amount: String(book.price * 100),
      });

      transaction.transaction_ref = paymentResponse.reference;
      transaction.email_address = req.user.email;
      transaction.paid_for = PaidFor.BOOK;
      transaction.actualAmount = book.price;
      await this.transactionRepo.save(transaction);
      await this.booksRepo.recordDownload({
        userId: req.user.id,
        bookId,
        status: OwnershipStatus.PENDING_PAYMENT,
        paymentRef: paymentResponse.reference,
      });

      // await this.eventRegistrationRepository.createRegistration({
      //   userId: req.user.id,
      //   eventId,
      //   status: RegistrationStatus.PENDING_PAYMENT,
      //   unitPrice: String(event.price),
      //   reference: paymentResponse.reference,
      // });

      return {
        message: 'Payment initiated',
        data: {
          authorization_url: paymentResponse.authorization_url,
          reference: paymentResponse.reference,
        },
      };
    }

    // If PAID, you’d verify payment here before recording download
    // if (book.accessType === BookAccessType.PAID) { ... }

    await this.booksRepo.recordDownload({
      userId: req.user.id,
      bookId,
      status: OwnershipStatus.CONFIRMED,
    });

    return {
      bookId,
      pdfUrl: book.pdfUrl,
      message: 'Download granted',
    };
  }

  async getBookByRef(ref: string) {
    return this.booksRepo.findDownloadByTransactionRef(ref);
  }

  async handlePaymentConfirmation(ref: string, email: string) {
    const download = await this.booksRepo.findDownloadByTransactionRef(ref);
    if (download) {
      download.status = OwnershipStatus.CONFIRMED;
      download.isActive = true;
      download.downloadedAt = new Date();
      await this.booksRepo.saveDownload(download);

      this.emailService
        .sendMail({
          to: email,
          subject: 'Download Successful',
          template: 'book-download',
          data: {
            username: download.user.first_name,
            book_title: download.book.title,
            book_author: download.book.author,
            price: download.book.price,
            transaction_ref: ref,
            purchased_at: download.createdAt,
            library_url: download.book.pdfUrl,
          },
        })
        .then((res) => {
          this.logger.log(res);
        })
        .catch((err) => this.logger.error(err));
    }
  }
}
