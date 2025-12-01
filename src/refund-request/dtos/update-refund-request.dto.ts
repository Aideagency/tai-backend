import { IsEnum, IsNumber, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RefundStatus } from 'src/database/entities/event.entity';

export class UpdateRefundStatusDto {
  @ApiProperty({
    example: RefundStatus.APPROVED,
    enum: RefundStatus,
    description: 'The new status of the refund request',
  })
  @IsEnum(RefundStatus)
  status: RefundStatus;

  @ApiPropertyOptional({
    example: 5000,
    description:
      'Amount approved to be refunded. Required if status = APPROVED',
  })
  @IsOptional()
  @IsNumber()
  approvedAmount?: number;

  @ApiPropertyOptional({
    example: 12,
    description: 'Admin user ID who approved or declined the refund',
  })
  @IsOptional()
  @IsNumber()
  approvedById?: number;

  @ApiPropertyOptional({
    example: '2025-02-15T10:30:00.000Z',
    description: 'Date and time when the refund was processed',
  })
  @IsOptional()
  @IsDateString()
  processedAt?: string;
}
