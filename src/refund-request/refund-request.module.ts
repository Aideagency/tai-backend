import { Module } from '@nestjs/common';
import { RefundRequestService } from './refund-request.service';
import { RepositoryModule } from 'src/repository/repository.module';
import { RefundRequestController } from './refund-request.controller';

@Module({
  providers: [RefundRequestService],
  exports: [RefundRequestService],
  imports: [RepositoryModule],
  controllers: [RefundRequestController],
})
export class RefundRequestModule {}
