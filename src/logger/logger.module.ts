import { Module, Global } from '@nestjs/common';
import { TracerLogger } from './logger.service';

@Global()
@Module({
  providers: [TracerLogger],
})
export class LoggerModule {}
