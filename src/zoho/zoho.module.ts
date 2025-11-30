import { Module } from '@nestjs/common';
import { ZohoController } from './zoho.controller';
import { ZohoService } from './zoho.service';
import { CommonModule } from 'src/common/common.module';

@Module({
  controllers: [ZohoController],
  providers: [ZohoService],
  imports: [CommonModule]
})
export class ZohoModule {}
