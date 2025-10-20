import { Module, Global, Logger } from '@nestjs/common';
import { TracerLogger } from './logger.service';

@Global()
@Module({
  providers: [
    TracerLogger,
    { provide: Logger, useExisting: TracerLogger }, // <-- alias
  ],
  exports: [TracerLogger, Logger], // <-- export both tokens
})
export class LoggerModule {}
