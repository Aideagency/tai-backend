import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { BaseRepository } from '../base.repository';
import { TransactionEntity } from 'src/database/entities/transaction.entity';
import { TransactionStatus } from 'src/database/entities/transaction.entity';
import { PaidFor } from 'src/database/entities/transaction.entity';

@Injectable()
export class TransactionRepository extends BaseRepository<
  TransactionEntity,
  Repository<TransactionEntity>
> {
  protected logger = new Logger(TransactionRepository.name);

  constructor(
    @InjectRepository(TransactionEntity)
    repository: Repository<TransactionEntity>,
  ) {
    super(repository);
  }

  // Create a new payment
  async createPayment(
    transactionData: Partial<TransactionEntity>,
  ): Promise<TransactionEntity> {
    const transaction = this.repository.create(transactionData);
    try {
      return await this.repository.save(transaction);
    } catch (err) {
      this.logger.error('Error creating payment: ', err.stack);
      throw err;
    }
  }

  // Update payment details
  async updatePayment(
    transactionRef: string,
    updateData: Partial<TransactionEntity>,
  ): Promise<UpdateResult> {
    try {
      return await this.repository.update(
        { transaction_ref: transactionRef },
        updateData,
      );
    } catch (err) {
      this.logger.error('Error updating payment: ', err.stack);
      throw err;
    }
  }

  // Get payments by their status
  async getPaymentsByStatus(
    status: TransactionStatus,
    relations: object = {},
  ): Promise<TransactionEntity[]> {
    try {
      return await this.repository.find({
        where: { status },
        relations,
      });
    } catch (err) {
      this.logger.error('Error fetching payments by status: ', err.stack);
      throw err;
    }
  }

  // Get payments by user
  async getPaymentsByUser(
    userId: number,
    relations: object = {},
  ): Promise<TransactionEntity[]> {
    try {
      return await this.repository.find({
        where: { user: { id: userId } },
        relations,
      });
    } catch (err) {
      this.logger.error('Error fetching payments by user: ', err.stack);
      throw err;
    }
  }

  // Get payments by the paid-for type (e.g., EVENT, COURSE)
  async getPaymentsByPaidFor(
    paidFor: PaidFor,
    relations: object = {},
  ): Promise<TransactionEntity[]> {
    try {
      return await this.repository.find({
        where: { paid_for: paidFor },
        relations,
      });
    } catch (err) {
      this.logger.error(
        'Error fetching payments by paid_for type: ',
        err.stack,
      );
      throw err;
    }
  }

  // Get payment by reference with relations
  async getPaymentWithRelations(
    reference: string,
    relations: object = {},
  ): Promise<TransactionEntity | undefined> {
    try {
      return await this.repository.findOne({
        where: { transaction_ref: reference },
        relations,
      });
    } catch (err) {
      this.logger.error('Error fetching payment by reference: ', err.stack);
      throw err;
    }
  }

  // Fetch all payments for a given user and status
  async getPaymentsByUserAndStatus(
    userId: number,
    status: TransactionStatus,
    relations: object = {},
  ): Promise<TransactionEntity[]> {
    try {
      return await this.repository.find({
        where: {
          user: { id: userId },
          status,
        },
        relations,
      });
    } catch (err) {
      this.logger.error(
        'Error fetching payments by user and status: ',
        err.stack,
      );
      throw err;
    }
  }

  // Find payment by reference and ensure it exists
  async findOneByReference(reference: string, relations: object = {}) {
    try {
      return await this.repository.findOne({
        where: {
          transaction_ref: reference,
        },
        relations,
      });
    } catch (err) {
      this.logger.error('Error finding payment by reference: ', err.stack);
      throw err;
    }
  }
}
