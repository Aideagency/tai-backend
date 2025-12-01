import { Injectable, NotFoundException } from '@nestjs/common';
// import {
//   RefundRequestRepository,
//   RefundRequestSearchParams,
// } from './refund-request.repository';
import {
  RefundRequestEntity,
  RefundStatus,
} from 'src/database/entities/refund-request.entity';
import {
  RefundRequestRepository,
  RefundRequestSearchParams,
} from 'src/repository/refund/refund-request.repository';
import { CreateRefundRequestDto } from './dtos/create-refund-request.dto';
import { UpdateRefundStatusDto } from './dtos/update-refund-request.dto';

@Injectable()
export class RefundRequestService {
  constructor(
    private readonly refundRequestRepository: RefundRequestRepository,
  ) {}

  /** Create a new refund request (user-facing) */
  async createRefundRequest(
    dto: CreateRefundRequestDto,
    requestedById: number,
  ): Promise<RefundRequestEntity> {
    const payload: Partial<RefundRequestEntity> = {
      ...dto,
      requestedBy: { id: requestedById } as any,
      status: RefundStatus.PENDING,
    };

    return this.refundRequestRepository.createRefundRequest(payload);
  }

  /** Get a single refund request with relations */
  async getRefundRequestById(id: number): Promise<RefundRequestEntity> {
    const refund = await this.refundRequestRepository.getRefundRequestById(id);
    if (!refund) {
      throw new NotFoundException('Refund request not found');
    }
    return refund;
  }

  /** Generic paginated search (admin/dashboard) */
  async searchRefundRequests(params: RefundRequestSearchParams) {
    return this.refundRequestRepository.searchPaginated(params);
  }

  /** Paginated refunds for a user (user dashboard) */
  async getUserRefundRequests(userId: number, page = 1, pageSize = 20) {
    return this.refundRequestRepository.getUserRefundRequestsPaginated(
      userId,
      page,
      pageSize,
    );
  }

  /** Paginated refunds by date range (admin/reports) */
  async getRefundRequestsByDateRange(
    createdFrom: Date,
    createdTo: Date,
    page = 1,
    pageSize = 20,
    extraFilters?: Omit<
      RefundRequestSearchParams,
      'page' | 'pageSize' | 'createdFrom' | 'createdTo'
    >,
  ) {
    return this.refundRequestRepository.getRefundRequestsByDateRangePaginated(
      createdFrom,
      createdTo,
      page,
      pageSize,
      extraFilters,
    );
  }

  /** Update refund request (e.g. approve/decline, processed, etc.) */
  async updateRefundStatus(id: number, dto: UpdateRefundStatusDto) {
    const existing =
      await this.refundRequestRepository.getRefundRequestById(id);
    if (!existing) {
      throw new NotFoundException('Refund request not found');
    }

    const updateData: Partial<RefundRequestEntity> = {
      //   status: dto.status,
      approvedAmount: String(dto.approvedAmount),
      processedAt: new Date(dto.processedAt),
      approvedBy: dto.approvedById
        ? ({ id: dto.approvedById } as any)
        : existing.approvedBy,
    };

    await this.refundRequestRepository.updateRefundRequest(id, updateData);
    return this.getRefundRequestById(id);
  }
}

/** -------- Simple DTOs (adjust fields to match your entity) -------- */

// import {
//   IsEnum,
//   IsNumber,
//   IsOptional,
//   IsPositive,
//   IsString,
//   IsDateString,
// } from 'class-validator';
// import {
//   RefundType,
//   PaidFor,
// } from 'src/database/entities/refund-request.entity';

// export class CreateRefundRequestDto {
//   @IsEnum(RefundType)
//   type: RefundType;

//   @IsEnum(PaidFor)
//   paidFor: PaidFor;

//   @IsNumber()
//   @IsPositive()
//   amount: number;

//   @IsOptional()
//   @IsString()
//   reason?: string;

//   // Optional relationships depending on what is being refunded
//   @IsOptional()
//   @IsNumber()
//   registrationId?: number;

//   @IsOptional()
//   @IsNumber()
//   counsellingBookingId?: number;

//   @IsOptional()
//   @IsNumber()
//   transactionId?: number;
// }

// export class RefundRequestSearchQueryDto {
//   @IsOptional()
//   @IsNumber()
//   page?: number;

//   @IsOptional()
//   @IsNumber()
//   pageSize?: number;

//   @IsOptional()
//   @IsNumber()
//   userId?: number;

//   @IsOptional()
//   @IsEnum(RefundStatus, { each: true })
//   status?: RefundStatus | RefundStatus[];

//   @IsOptional()
//   @IsEnum(RefundType, { each: true })
//   type?: RefundType | RefundType[];

//   @IsOptional()
//   @IsEnum(PaidFor, { each: true })
//   paidFor?: PaidFor | PaidFor[];

//   @IsOptional()
//   @IsDateString()
//   createdFrom?: string;

//   @IsOptional()
//   @IsDateString()
//   createdTo?: string;

//   @IsOptional()
//   @IsString()
//   q?: string;

//   @IsOptional()
//   @IsString()
//   orderBy?: 'createdAt' | 'id' | 'approvedAt' | 'processedAt';

//   @IsOptional()
//   @IsString()
//   orderDir?: 'ASC' | 'DESC';
// }
