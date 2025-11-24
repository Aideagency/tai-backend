import { forwardRef, Module } from '@nestjs/common';
import { CounsellingService } from './counselling.service';
import { CounsellingController } from './counselling.controller';
import { RepositoryModule } from 'src/repository/repository.module';
import { PaymentModule } from 'src/payment/payment.module';

@Module({
  providers: [CounsellingService],
  controllers: [CounsellingController],
  exports: [CounsellingService],
  imports: [RepositoryModule, forwardRef(() => PaymentModule)],
})
export class CounsellingModule {}
