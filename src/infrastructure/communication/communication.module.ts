import { Global, Module } from '@nestjs/common';
import { EmailService } from './email/email.service';
import { SendGridClient } from './email/sendgrid-mail.service';
import { LoggerModule } from 'src/logger/logger.module';

@Global()
@Module({
  imports: [LoggerModule],
  providers: [EmailService, SendGridClient],
  exports: [EmailService],
})
export class CommunicationModule {}
