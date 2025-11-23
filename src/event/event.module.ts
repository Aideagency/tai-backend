import { Module, forwardRef } from '@nestjs/common';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { RepositoryModule } from 'src/repository/repository.module';
import { PaymentModule } from 'src/payment/payment.module';

@Module({
  providers: [EventService],
  controllers: [EventController],
  imports: [
    RepositoryModule,
    forwardRef(() => PaymentModule), // ⬅️ important
  ],
  exports: [EventService],
})
export class EventModule {}
