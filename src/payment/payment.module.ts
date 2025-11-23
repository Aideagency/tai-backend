import { Module, forwardRef } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { RepositoryModule } from 'src/repository/repository.module';
import { CommonModule } from 'src/common/common.module';
import { EventModule } from 'src/event/event.module';

@Module({
  imports: [
    RepositoryModule,
    CommonModule,
    forwardRef(() => EventModule), // ⬅️ important
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
