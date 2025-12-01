import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsDateString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { RefundStatus } from 'src/database/entities/event.entity';
import {
  RefundType,
  PaidFor,
} from 'src/database/entities/refund-request.entity';

export class RefundRequestSearchQueryDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Page number for pagination',
  })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({
    example: 20,
    description: 'Number of items per page',
  })
  @IsOptional()
  @IsNumber()
  pageSize?: number;

  @ApiPropertyOptional({
    example: 42,
    description: 'Filter by user requesting the refund',
  })
  @IsOptional()
  @IsNumber()
  userId?: number;

  @ApiPropertyOptional({
    example: [RefundStatus.REQUESTED, RefundStatus.APPROVED],
    enum: RefundStatus,
    isArray: true,
    description: 'Filter refund requests by status',
  })
  @IsOptional()
  @IsEnum(RefundStatus, { each: true })
  status?: RefundStatus | RefundStatus[];

  @ApiPropertyOptional({
    example: RefundType.FULL,
    enum: RefundType,
    description: 'Filter by refund type',
  })
  @IsOptional()
  @IsEnum(RefundType, { each: true })
  type?: RefundType | RefundType[];

  @ApiPropertyOptional({
    example: PaidFor.EVENT,
    enum: PaidFor,
    description: 'Filter based on what the payment was for',
  })
  @IsOptional()
  @IsEnum(PaidFor, { each: true })
  paidFor?: PaidFor | PaidFor[];

  @ApiPropertyOptional({
    example: '2025-01-01',
    description: 'Filter by start date of createdAt range',
  })
  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @ApiPropertyOptional({
    example: '2025-01-31',
    description: 'Filter by end date of createdAt range',
  })
  @IsOptional()
  @IsDateString()
  createdTo?: string;

  @ApiPropertyOptional({
    example: 'john doe',
    description:
      'Text search: matches event title, counselling title, user email, first or last name',
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    example: 'createdAt',
    enum: ['createdAt', 'id', 'approvedAt', 'processedAt'],
    description: 'Field to sort by',
  })
  @IsOptional()
  @IsString()
  orderBy?: 'createdAt' | 'id' | 'approvedAt' | 'processedAt';

  @ApiPropertyOptional({
    example: 'DESC',
    enum: ['ASC', 'DESC'],
    description: 'Sorting direction',
  })
  @IsOptional()
  @IsString()
  orderDir?: 'ASC' | 'DESC';
}
