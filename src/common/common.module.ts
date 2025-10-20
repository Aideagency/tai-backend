import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CommonHttpService } from './common.service';
import { LoggerModule } from 'src/logger/logger.module';
// import { LoggerModule } from 'src/logger/logger.module';

@Module({
  imports: [HttpModule, LoggerModule],
  providers: [CommonHttpService],
  exports: [CommonHttpService],
})
export class CommonModule {}
