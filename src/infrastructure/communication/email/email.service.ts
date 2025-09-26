import { Injectable } from '@nestjs/common';
import { MailDataRequired } from '@sendgrid/mail';
import * as fs from 'fs';
import * as path from 'path';
import * as ejs from 'ejs';
// import * as puppeteer from 'puppeteer';
import * as html_to_pdf from 'html-pdf-node';
import * as nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import { SendGridClient } from './sendgrid-mail.service';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { TracerLogger } from 'src/logger/logger.service';

export interface MailOptions {
  to: string | string[];
  subject: string;
  template: string;
  data: any;
  attachments?: Array<any>;
  cc?: Array<any>;
  bcc?: Array<any>;
}

@Injectable()
export class EmailService {
  private SMTPOptions: SMTPTransport.Options = {
    host: 'smtp.gmail.com',
    service: process.env.MAIL_SERVICE,
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
    timeout: 30000,
    port: 465,
    secure: true,
  };
  private templateCache: Map<string, string> = new Map();

  constructor(
    private readonly sendGridClient: SendGridClient,
    private readonly logger: TracerLogger,
  ) {}

  async sendMail(mailOptions: MailOptions): Promise<void> {
    const { to, subject, template, data, attachments, cc, bcc } = mailOptions;
    try {
      const appendTring = process.env.NODE_ENV !== 'development' ? '' : 'DEV: ';

      const html = await this.renderTemplate(template, data);

      // Build BCC list based on environment
      let emailbcc = [];

      // if (process.env.NODE_ENV === 'production') {
      //   emailbcc = ['it_notifications@cardinalstone.com'];
      // } else {
      //   // In non-production, only add monitoring emails to BCC
      //   emailbcc = ['outsourceddev@gmail.com'];
      // }

      const msg: MailDataRequired = {
        to,
        from: {
          name: 'TAI',
          email: 'no-reply@tai.com',
        },
        subject: `${appendTring}${subject}`,
        html,
        bcc: emailbcc,
      };

      // if (cc && cc.length > 0) {
      //   msg.cc = cc;
      // }

      // if (bcc && bcc.length > 0) {
      //   if (typeof bcc === 'string') {
      //     const newBcc = [...emailbcc, bcc];
      //     msg.bcc = newBcc;
      //   }
      //   if (Array.isArray(bcc)) {
      //     const newBcc = [...emailbcc, ...bcc];
      //     msg.bcc = newBcc;
      //   }
      // }

      if (!!attachments) {
        msg.attachments = attachments;
      }

      // if (process.env.NODE_ENV !== 'production') {
      //   msg.to = 'it_notifications@cardinalstone.com';
      // }
      process.env.NODE_ENV !== 'development'
        ? await this.sendGridClient.send(msg)
        : await this.sendSMTPEmail(msg as unknown as Mail.Options);
    } catch (error) {
      console.error('Error sending email', JSON.stringify(error));
      throw error;
    }
  }

  sendSMTPEmail = async (msg: Mail.Options): Promise<void> => {
    const transporter = nodemailer.createTransport(this.SMTPOptions);
    try {
      await transporter.sendMail(msg);
      this.logger.info('Email sent successfully!');
    } catch (error) {
      this.logger.error('Error sending email:', error);
      throw error;
    }
  };

  async renderTemplate(template: string, data: any): Promise<string> {
    try {
      const templatePath = path.join(
        process.cwd(),
        'src',
        'infrastructure',
        'communication',
        'email',
        'templates',
        `${template}.ejs`,
      );

      let templateContent = this.templateCache.get(template);

      if (!templateContent) {
        if (!fs.existsSync(templatePath)) {
          throw new Error(`Template not found: ${template}`);
        }
        templateContent = fs.readFileSync(templatePath, 'utf8');
        this.templateCache.set(template, templateContent);
      }

      return ejs.render(templateContent, data);
    } catch (error) {
      // this.logger.error(`Failed to render template ${template}:`, error);
      throw new Error(`Template rendering failed: ${error.message}`);
    }
  }

  async htmlToPDF(html: string): Promise<Buffer> {
    const options = {
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm', // 1cm = 10mm
        right: '10mm',
        bottom: '10mm',
        left: '10mm',
      },
    };

    // html-pdf-node accepts either a file or html content
    const file = { content: html };

    try {
      const pdfBuffer = await html_to_pdf.generatePdf(file, options);
      return pdfBuffer;
    } catch (error) {
      console.error(`${error.message} ${error.stack}`);
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }
}
