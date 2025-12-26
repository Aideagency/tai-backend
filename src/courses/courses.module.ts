import { forwardRef, Module } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { CommonModule } from 'src/common/common.module';
import { RepositoryModule } from 'src/repository/repository.module';
import { AdminCoursesController } from './admin-courses.controller';
import { AdminCoursesService } from './admin-courses.service';
import { PaymentModule } from 'src/payment/payment.module';

@Module({
  providers: [CoursesService, AdminCoursesService],
  controllers: [CoursesController, AdminCoursesController],
  imports: [CommonModule, RepositoryModule, forwardRef(() => PaymentModule)],
  exports: [CoursesService],
})
export class CoursesModule {}
