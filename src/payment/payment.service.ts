import { Injectable, HttpStatus, HttpException } from '@nestjs/common';
import { CommonHttpService } from 'src/common/common.service';
import {
  TransactionEntity,
  TransactionStatus,
} from 'src/database/entities/transaction.entity';
import { TracerLogger } from 'src/logger/logger.service';
import { TransactionRepository } from 'src/repository/transaction/transaction.repository';
import * as crypto from 'crypto';

@Injectable()
export class PaymentService {
  private readonly paystackBaseUrl = 'https://api.paystack.co';

  constructor(
    private readonly logger: TracerLogger,
    private readonly commonhttpService: CommonHttpService,
    private readonly transactionRepository: TransactionRepository,
  ) {}

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

  // Verify Payment
  async verifyPayment(reference: string): Promise<any> {
    try {
      const response = await this.commonhttpService.get(
        `${this.paystackBaseUrl}/transaction/verify/${reference}`,
        {
          Authorization: `Bearer ${process.env.PAYSTACK_KEY}`,
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
          Authorization: `Bearer ${process.env.PAYSTACK_KEY}`,
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
      const secret = process.env.PAYSTACK_KEY;
      const hash = crypto
        .createHmac('sha512', secret)
        .update(JSON.stringify(req.body))
        .digest('hex');

      console.log({ hash });

      if (hash === req.headers['x-paystack-signature']) {
        const txRef = req.body?.data?.reference;
        const forwarded = req.headers['x-forwarded-for'];
        const ip = Array.isArray(forwarded)
          ? forwarded[0]
          : forwarded?.split(',')[0];
        this.logger.log({ ip: ip || req.ip });

        const isIncorrectIp = ![
          '52.31.139.75',
          '52.49.173.169',
          '52.214.14.220',
        ].includes(ip);

        if (isIncorrectIp) {
          await this.updatePaymentStatus(txRef, TransactionStatus.Failure);
          return { isVerified: false, txRef: '' };
        }

        const transaction =
          await this.transactionRepository.findOneByReference(txRef);
        if (
          transaction &&
          req.body.data?.requested_amount === transaction.actualAmount * 100
        ) {
          await this.updatePaymentStatus(txRef, TransactionStatus.Success);
          return { isVerified: true, txRef };
        }

        console.log({ txRef, transaction });
        await this.updatePaymentStatus(txRef, TransactionStatus.Failure);
        return { isVerified: false, txRef: '' };
      }
      return { isVerified: false, txRef: '' };
    } catch (err) {
      this.logger.error(err);
      return { isVerified: false, txRef: '' };
    }
  }

  // Check if transaction reference exists
  async doesTxRefExist(txRef: string): Promise<boolean> {
    const existingTransaction =
      await this.transactionRepository.findOneByReference(txRef);
    return !!existingTransaction;
  }
}
