import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../base.repository';
import { RefundRequestEntity } from 'src/database/entities/refund-request.entity';
import { RefundStatus } from 'src/database/entities/event.entity';

@Injectable()
export class RefundRequestRepository extends BaseRepository<
  RefundRequestEntity,
  Repository<RefundRequestEntity>
> {
  protected logger = new Logger(RefundRequestRepository.name);

  constructor(
    @InjectRepository(RefundRequestEntity)
    repository: Repository<RefundRequestEntity>,
  ) {
    super(repository);
  }

  // Create a new refund request
  async createRefundRequest(params: {
    registrationId: number;
    amount: string;
    reason?: string;
  }): Promise<RefundRequestEntity> {
    const refundRequest = this.repository.create({
      registration: { id: params.registrationId } as any,
      amount: params.amount,
      reason: params.reason || null,
      status: RefundStatus.REQUESTED, // assuming 'REQUESTED' is the initial status
    });

    return this.repository.save(refundRequest);
  }

  // Approve a refund request
  async approveRefund(refundId: number): Promise<RefundRequestEntity> {
    const refundRequest = await this.repository.findOne({
      where: { id: refundId },
    });

    if (!refundRequest) {
      throw new NotFoundException('Refund request not found');
    }

    refundRequest.status = RefundStatus.APPROVED;
    refundRequest.approvedAt = new Date();

    return this.repository.save(refundRequest);
  }

  // Reject a refund request
  async rejectRefund(refundId: number): Promise<RefundRequestEntity> {
    const refundRequest = await this.repository.findOne({
      where: { id: refundId },
    });

    if (!refundRequest) {
      throw new NotFoundException('Refund request not found');
    }

    refundRequest.status = RefundStatus.REJECTED;
    return this.repository.save(refundRequest);
  }

  // Mark refund as processed
  async processRefund(refundId: number): Promise<RefundRequestEntity> {
    const refundRequest = await this.repository.findOne({
      where: { id: refundId },
    });

    if (!refundRequest) {
      throw new NotFoundException('Refund request not found');
    }

    refundRequest.status = RefundStatus.PROCESSED;
    refundRequest.processedAt = new Date();

    return this.repository.save(refundRequest);
  }
}
