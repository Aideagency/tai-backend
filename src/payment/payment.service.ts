import { Injectable, HttpStatus, HttpException } from '@nestjs/common';
import { CommonHttpService } from 'src/common/common.service';
import { TransactionEntity } from 'src/database/entities/transaction.entity';
import { TracerLogger } from 'src/logger/logger.service';
import { TransactionRepository } from 'src/repository/transaction/transaction.repository';
import { InitialisePaystackPaymentDto } from './dto/initialize-payment.dto';

@Injectable()
export class PaymentService {
  private readonly paystackBaseUrl = 'https://api.paystack.co';

  constructor(
    private readonly logger: TracerLogger,
    private readonly commonhttpService: CommonHttpService,
    private readonly transactionRepository: TransactionRepository,
    // private readonly activityLogRepository: ActivityLogRepository,
    // private readonly configService: ConfigService,
  ) {
    // this.logger.setContext(PaystackService.name);
  }

  async initializePayment(data: {
    email: string;
    amount: string;
  }): Promise<any> {
    try {
      const response = await this.commonhttpService.post(
        `${this.paystackBaseUrl}/transaction/initialize`,
        data,
        {
          Authorization: `Bearer ${process.env.PAYSTACK_KEY}`,
          'Content-Type': 'application/json',
        },
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data || 'Payment initialization failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  //   async verifyPayment(reference: string, secret: string): Promise<any> {
  //     try {
  //       const response = await this.commonhttpService.get(
  //         `${this.paystackBaseUrl}/transaction/verify/${reference}`,
  //         {
  //           Authorization: `Bearer ${secret}`,
  //           'Content-Type': 'application/json',
  //         },
  //       );
  //       return response.data;
  //     } catch (error) {
  //       throw new HttpException(
  //         error.response?.data || 'Payment verification failed',
  //         HttpStatus.BAD_REQUEST,
  //       );
  //     }
  //   }

  //   async verifyWebhookSignaturWithoutReference(
  //     req: any,
  //     secret: string,
  //   ): Promise<{ isVerified: boolean }> {
  //     try {
  //       const hash = crypto
  //         .createHmac('sha512', secret)
  //         .update(JSON.stringify(req.body))
  //         .digest('hex');

  //       if (hash === req.headers['x-paystack-signature']) {
  //         const forwarded = req.headers['x-forwarded-for'];
  //         const ip = Array.isArray(forwarded)
  //           ? forwarded[0]
  //           : forwarded?.split(',')[0];
  //         this.logger.log({ ip: ip || req.ip });

  //         const isIncorrectIp = ![
  //           '52.31.139.75',
  //           '52.49.173.169',
  //           '52.214.14.220',
  //         ].includes(ip);

  //         this.logger.log({ body: req.body.data });

  //         if (isIncorrectIp) {
  //           return { isVerified: false };
  //         }

  //         return { isVerified: true };
  //       }

  //       return { isVerified: false };
  //     } catch (err) {
  //       this.logger.error(err);
  //       return { isVerified: false };
  //     }
  //   }

  //   async verifyWebhookSignatureOnly(
  //     req: any,
  //     secret: string,
  //   ): Promise<{ isVerified: boolean; txRef: string }> {
  //     try {
  //       const hash = crypto
  //         .createHmac('sha512', secret)
  //         .update(JSON.stringify(req.body))
  //         .digest('hex');

  //       this.logger.log({
  //         verifyWebhookSignatureOnlyHash: hash,
  //         paystackHash: req.headers['x-paystack-signature'],
  //         compareHash: hash === req.headers['x-paystack-signature'],
  //       });

  //       if (hash === req.headers['x-paystack-signature']) {
  //         const txRef = req.body?.data?.reference;

  //         const forwarded = req.headers['x-forwarded-for'];
  //         const ip = Array.isArray(forwarded)
  //           ? forwarded[0]
  //           : forwarded?.split(',')[0];
  //         this.logger.log({ ip: ip || req.ip });

  //         const isIncorrectIp = ![
  //           '52.31.139.75',
  //           '52.49.173.169',
  //           '52.214.14.220',
  //         ].includes(ip);

  //         this.logger.log({ body: req.body.data });

  //         this.logger.log({
  //           ipNuban: ip,
  //           isIncorrectIp,
  //           paystackAmount: req.body.data?.requested_amount,
  //           transactionAmount: req.body.data?.requested_amount / 100,
  //         });

  //         if (isIncorrectIp) {
  //           return { isVerified: false, txRef: '' };
  //         }

  //         return { isVerified: true, txRef };
  //       }

  //       return { isVerified: false, txRef: '' };
  //     } catch (err) {
  //       this.logger.error(err);
  //       return { isVerified: false, txRef: '' };
  //     }
  //   }

  //   async verifyWebhookSignature(
  //     req: any,
  //     secret: string,
  //   ): Promise<{ isVerified: boolean; txRef: string }> {
  //     try {
  //       const hash = crypto
  //         .createHmac('sha512', secret)
  //         .update(JSON.stringify(req.body))
  //         .digest('hex');

  //       if (hash === req.headers['x-paystack-signature']) {
  //         const txRef = req.body?.data?.reference;
  //         const transaction = await this.transactionRepository.findOne(
  //           {
  //             transaction_ref: txRef,
  //           },
  //           {
  //             user: true,
  //           },
  //         );

  //         if (transaction.user) {
  //           const activityLogEntry = ActivityLogEntry.getLogMessage(
  //             ActivityType.WebhookResponse,
  //             transaction.user,
  //             `${transaction.amount}, ${transaction.transaction_ref}, `,
  //             JSON.stringify(req.body),
  //             null,
  //           );

  //           await this.activityLogRepository.save(activityLogEntry);
  //         }

  //         const forwarded = req.headers['x-forwarded-for'];
  //         const ip = Array.isArray(forwarded)
  //           ? forwarded[0]
  //           : forwarded?.split(',')[0];
  //         this.logger.log({ ip: ip || req.ip });

  //         const isIncorrectIp = ![
  //           '52.31.139.75',
  //           '52.49.173.169',
  //           '52.214.14.220',
  //         ].includes(ip);

  //         this.logger.log({ body: req.body.data });

  //         this.logger.log({
  //           ip,
  //           isIncorrectIp,
  //           paystackAmount: req.body.data?.requested_amount,
  //           transactionAmount: transaction?.actualAmount * 100,
  //         });

  //         if (isIncorrectIp) {
  //           return { isVerified: false, txRef: '' };
  //         }

  //         if (
  //           req.body.data?.requested_amount !==
  //           transaction?.actualAmount * 100
  //         ) {
  //           return { isVerified: false, txRef: '' };
  //         }

  //         return { isVerified: true, txRef };
  //       }

  //       return { isVerified: false, txRef: '' };
  //     } catch (err) {
  //       this.logger.error(err);
  //       return { isVerified: false, txRef: '' };
  //     }
  //   }

  async updatePaymentAction(txRef, status) {
    try {
      const transaction = await this.transactionRepository.findOne({
        transaction_ref: txRef,
      });

      if (!transaction) {
        return;
      }

      transaction.status = status;
      await this.transactionRepository.save(transaction);
    } catch (error) {
      this.logger.error(error.stack);
    }
  }

  async doesTxRefExist(txRef: string): Promise<boolean> {
    const existingTransaction = await this.transactionRepository.findOne({
      transaction_ref: txRef,
    });

    return !!existingTransaction;
  }

  //   async getOneTransaction(txRef: string): Promise<TransactionEntity> {
  //     try {
  //       const existingTransaction = await this.transactionRepository.findOne({
  //         transaction_ref: txRef,
  //       });

  //       return existingTransaction;
  //     } catch (error) {
  //       this.logger.error(error.stack);
  //     }
  //   }
}
