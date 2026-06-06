import {
  Injectable,
  HttpStatus,
  HttpException,
  Inject,
  forwardRef,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { CommonHttpService } from 'src/common/common.service';
import {
  PaidFor,
  TransactionEntity,
  TransactionStatus,
} from 'src/database/entities/transaction.entity';
import { TracerLogger } from 'src/logger/logger.service';
import { TransactionRepository } from 'src/repository/transaction/transaction.repository';
import * as crypto from 'crypto';
// import { EventRegistrationRepository } from 'src/repository/event/event-registration.repository';
// import { RegistrationStatus } from 'src/database/entities/event-registration.entity';
import { EventService } from 'src/event/event.service';
import { CounsellingService } from 'src/counselling/counselling.service';
import { BooksService } from 'src/books/books.service';
import { CoursesService } from 'src/courses/courses.service';

@Injectable()
export class PaymentService {
  private readonly paystackBaseUrl = 'https://api.paystack.co';
  private readonly paystackIps = new Set([
    '52.31.139.75',
    '52.49.173.169',
    '52.214.14.220',
  ]);

  constructor(
    private readonly logger: TracerLogger,
    private readonly commonhttpService: CommonHttpService,
    private readonly transactionRepository: TransactionRepository,
    @Inject(forwardRef(() => EventService))
    private readonly eventService: EventService,
    @Inject(forwardRef(() => CounsellingService))
    private readonly counsellingService: CounsellingService,
    @Inject(forwardRef(() => BooksService))
    private readonly bookService: BooksService,
    @Inject(forwardRef(() => CoursesService))
    private readonly courseService: CoursesService,
  ) {}

  private getPaystackSecret(): string {
    const secret = process.env.PAYSTACK_KEY;
    if (!secret) {
      throw new HttpException(
        'Payment provider is not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return secret;
  }

  private getWebhookPayload(req: any): Buffer {
    if (Buffer.isBuffer(req.rawBody)) return req.rawBody;
    if (typeof req.rawBody === 'string') return Buffer.from(req.rawBody);

    return Buffer.from(JSON.stringify(req.body ?? {}));
  }

  private isValidPaystackSignature(req: any): boolean {
    const signature = req.headers?.['x-paystack-signature'];
    if (!signature || typeof signature !== 'string') return false;
    if (!/^[a-f0-9]{128}$/i.test(signature)) return false;

    const hash = crypto
      .createHmac('sha512', this.getPaystackSecret())
      .update(this.getWebhookPayload(req))
      .digest('hex');

    const expected = Buffer.from(hash, 'hex');
    const received = Buffer.from(signature, 'hex');

    return (
      expected.length === received.length &&
      crypto.timingSafeEqual(expected, received)
    );
  }

  private getRequesterIp(req: any): string {
    const forwarded = req.headers?.['x-forwarded-for'];
    const forwardedIp = Array.isArray(forwarded)
      ? forwarded[0]
      : forwarded?.split(',')[0];

    return (forwardedIp || req.ip || req.socket?.remoteAddress || '')
      .trim()
      .replace(/^::ffff:/, '');
  }

  private isAllowedPaystackIp(req: any): boolean {
    const ip = this.getRequesterIp(req);
    this.logger.log({ ip });

    return this.paystackIps.has(ip);
  }

  private getGatewayData(verification: any) {
    return verification?.data ?? verification;
  }

  private assertGatewayPaymentMatchesTransaction(
    gatewayData: any,
    transaction: TransactionEntity,
  ) {
    if (!gatewayData) {
      throw new BadRequestException('Payment verification response is empty');
    }

    if (gatewayData.reference !== transaction.transaction_ref) {
      throw new BadRequestException('Payment reference mismatch');
    }

    if (gatewayData.status !== 'success') {
      throw new BadRequestException('Payment has not succeeded');
    }

    const gatewayAmount = Number(
      gatewayData.requested_amount ?? gatewayData.amount,
    );
    const expectedAmount = Math.round(Number(transaction.actualAmount) * 100);

    if (!Number.isFinite(gatewayAmount) || gatewayAmount !== expectedAmount) {
      throw new BadRequestException('Payment amount mismatch');
    }
  }

  private async fulfillTransaction(transaction: TransactionEntity) {
    const txRef = transaction.transaction_ref;

    if (transaction.status === TransactionStatus.Success) {
      return { isVerified: true, txRef };
    }

    if (transaction.paid_for === PaidFor.EVENT) {
      await this.eventService.handlePaymentConfirmation(
        txRef,
        transaction.email_address,
      );
    } else if (transaction.paid_for === PaidFor.COUNSELLING) {
      await this.counsellingService.handlePaymentConfirmation(
        txRef,
        transaction.email_address,
      );
    } else if (transaction.paid_for === PaidFor.BOOK) {
      await this.bookService.handlePaymentConfirmation(
        txRef,
        transaction.email_address,
      );
    } else if (transaction.paid_for === PaidFor.COURSE) {
      await this.courseService.handlePaymentConfirmation(
        txRef,
        transaction.email_address,
      );
    }

    await this.updatePaymentStatus(txRef, TransactionStatus.Success);

    return { isVerified: true, txRef };
  }

  async processVerifiedPaymentReference(reference: string) {
    const txRef = (reference || '').trim();
    if (!txRef) throw new BadRequestException('Transaction reference required');

    const transaction =
      await this.transactionRepository.findOneByReference(txRef);
    if (!transaction) throw new BadRequestException('Transaction not found');

    const verification = await this.verifyPayment(txRef);
    const gatewayData = this.getGatewayData(verification);
    this.assertGatewayPaymentMatchesTransaction(gatewayData, transaction);

    return this.fulfillTransaction(transaction);
  }

  // Initialize Payment
  async initializePayment(data: {
    email: string;
    amount: string;
  }): Promise<any> {
    try {
      const response = await this.commonhttpService.post(
        `${this.paystackBaseUrl}/transaction/initialize`,
        data,
        {
          Authorization: `Bearer ${this.getPaystackSecret()}`,
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

  // Verify Payment
  async verifyPayment(reference: string): Promise<any> {
    const txRef = encodeURIComponent((reference || '').trim());
    if (!txRef) throw new BadRequestException('Transaction reference required');

    try {
      const response = await this.commonhttpService.get(
        `${this.paystackBaseUrl}/transaction/verify/${txRef}`,
        {
          Authorization: `Bearer ${this.getPaystackSecret()}`,
          'Content-Type': 'application/json',
        },
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        error.message ||
          error.response?.data ||
          error.response?.data?.message ||
          'Payment verification failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Create new payment record
  async createPaymentRecord(
    paymentData: Partial<TransactionEntity>,
  ): Promise<TransactionEntity> {
    try {
      const transaction =
        await this.transactionRepository.createPayment(paymentData);
      return transaction;
    } catch (error) {
      this.logger.error('Error creating payment record: ', error.stack);
      throw new HttpException(
        'Error creating payment record',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Update payment action/status
  async updatePaymentStatus(
    txRef: string,
    status: TransactionStatus,
  ): Promise<void> {
    try {
      await this.transactionRepository.updatePayment(txRef, { status });
    } catch (error) {
      this.logger.error('Error updating payment status: ', error.stack);
      throw new HttpException(
        'Error updating payment status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Refund Payment
  async refundPayment(txRef: string, amount: string): Promise<any> {
    try {
      const response = await this.commonhttpService.post(
        `${this.paystackBaseUrl}/refund`,
        { transaction: txRef, amount },
        {
          Authorization: `Bearer ${this.getPaystackSecret()}`,
          'Content-Type': 'application/json',
        },
      );
      return response.data;
    } catch (error) {
      this.logger.error('Error refunding payment: ', error.stack);
      throw new HttpException(
        error.response?.data || 'Refund failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Webhook Signature Verification (Revised)
  async verifyWebhookSignature(
    req: any,
  ): Promise<{ isVerified: boolean; txRef: string }> {
    try {
      if (!this.isValidPaystackSignature(req)) {
        throw new UnauthorizedException('Invalid Paystack signature');
      }

      if (!this.isAllowedPaystackIp(req)) {
        throw new UnauthorizedException('Invalid Paystack source IP');
      }

      const txRef = req.body?.data?.reference;
      if (!txRef) throw new BadRequestException('Missing payment reference');

      const transaction =
        await this.transactionRepository.findOneByReference(txRef);
      if (!transaction) throw new BadRequestException('Transaction not found');

      this.assertGatewayPaymentMatchesTransaction(req.body?.data, transaction);

      return this.fulfillTransaction(transaction);
    } catch (err) {
      this.logger.error(err);
      throw err;
    }
  }

  // Check if transaction reference exists
  async doesTxRefExist(txRef: string): Promise<boolean> {
    const existingTransaction =
      await this.transactionRepository.findOneByReference(txRef);
    return !!existingTransaction;
  }

  async verifyIfCompleted(txRef: string, userEmail?: string): Promise<boolean> {
    try {
      const existingTransaction =
        await this.transactionRepository.findOneByReference(txRef);

      return (
        !!existingTransaction &&
        (!userEmail || existingTransaction.email_address === userEmail) &&
        existingTransaction.status === TransactionStatus.Success
      );
    } catch (error) {
      this.logger.error(
        `Error verifying if transaction is completed for txRef=${txRef}: `,
        error?.stack || error,
      );

      throw new HttpException(
        'Error verifying transaction status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
