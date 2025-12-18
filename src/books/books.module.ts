import { forwardRef, Module } from '@nestjs/common';
import { BooksService } from './books.service';
import { BooksController } from './books.controller';
import { RepositoryModule } from 'src/repository/repository.module';
import { PaymentModule } from 'src/payment/payment.module';
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module';
import { AdminBooksController } from './books.admin.controller';
import { AdminBooksService } from './books.admin.service';

@Module({
  providers: [BooksService, AdminBooksService],
  controllers: [BooksController, AdminBooksController],
  imports: [
    RepositoryModule,
    InfrastructureModule,
    forwardRef(() => PaymentModule),
  ],
  exports: [AdminBooksService, BooksService],
})
export class BooksModule {}
