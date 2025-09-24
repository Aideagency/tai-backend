import { Inject, Injectable } from '@nestjs/common';
import * as SendGrid from '@sendgrid/mail';
import { MailDataRequired } from '@sendgrid/mail';
import { TracerLogger } from 'src/logger/logger.service';
// import { SentryLogger } from 'src/infrastructure/logger/logger.service';

@Injectable()
export class SendGridClient {
  constructor(private readonly logger: TracerLogger) {
    // this.logger.setContext(SendGridClient.name);
    //Get the API key from config service or environment variable
    SendGrid.setApiKey(process.env.SENDGRID_API_KEY);
  }

  async send(mail: MailDataRequired): Promise<void> {
    try {
      await SendGrid.send(mail);
      this.logger.log(`Email successfully dispatched to ${mail.to as string}`);
    } catch (error) {
      //You can do more with the error
      this.logger.error('Error while sending email', error);
      throw error;
    }
  }
}
