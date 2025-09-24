import { Module, Global } from '@nestjs/common';
import { TracerLogger } from './logger.service';

@Global()
@Module({
  providers: [TracerLogger],
  exports: [TracerLogger],
})
export class LoggerModule {}
