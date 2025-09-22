import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { RepositoryModule } from 'src/repository/repository.module';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [RepositoryModule, CommonModule],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
