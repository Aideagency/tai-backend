import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsDate,
  IsInt,
  Min,
} from 'class-validator';
import { CounsellingBookingStatus } from 'src/database/entities/counselling-booking.entity';

export class GetCounsellingBookingsFilterDto {
  @ApiPropertyOptional({
    description: 'Search by client name, email, or notes',
    example: 'anxiety',
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    description: 'Filter by booking status',
    enum: CounsellingBookingStatus,
    example: CounsellingBookingStatus.CONFIRMED,
  })
  @IsOptional()
  @IsEnum(CounsellingBookingStatus, {
    message:
      'status must be one of PENDING_PAYMENT, CONFIRMED, CANCELLED, COMPLETED, NO_SHOW, REFUNDED',
  })
  status?: CounsellingBookingStatus;

  @ApiPropertyOptional({
    description: 'Filter bookings created from this date (ISO)',
    example: '2025-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from?: Date;

  @ApiPropertyOptional({
    description: 'Filter bookings created up to this date (ISO)',
    example: '2025-01-31T23:59:59.999Z',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to?: Date;

  @ApiPropertyOptional({
    description: 'Filter by counsellor adminId (if multiple counsellors exist)',
    example: 7,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  counsellorId?: number;

  @ApiPropertyOptional({
    description: 'Filter by user (client) id',
    example: 22,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId?: number;

  // Pagination
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of results per page',
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 20;

  // Sorting
  @ApiPropertyOptional({
    description: 'Field to sort by',
    example: 'createdAt',
    enum: ['createdAt', 'startsAt', 'id'],
  })
  @IsOptional()
  @IsString()
  orderBy?: 'createdAt' | 'startsAt' | 'id' = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort direction',
    example: 'DESC',
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @IsString()
  orderDir?: 'ASC' | 'DESC' = 'DESC';
}
