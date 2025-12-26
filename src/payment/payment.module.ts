import { Module, forwardRef } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { RepositoryModule } from 'src/repository/repository.module';
import { CommonModule } from 'src/common/common.module';
import { EventModule } from 'src/event/event.module';
import { CounsellingModule } from 'src/counselling/counselling.module';
import { BooksModule } from 'src/books/books.module';
import { CoursesModule } from 'src/courses/courses.module';

@Module({
  imports: [
    RepositoryModule,
    CommonModule,
    forwardRef(() => EventModule),
    forwardRef(() => CounsellingModule),
    forwardRef(() => BooksModule),
    forwardRef(() => CoursesModule),
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
