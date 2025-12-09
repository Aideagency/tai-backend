import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  RefundType,
  PaidFor,
} from 'src/database/entities/refund-request.entity';

export class CreateRefundRequestDto {
  @ApiProperty({
    example: RefundType.FULL,
    enum: RefundType,
    description: 'Type of refund being requested (FULL | PARTIAL)',
  })
  @IsEnum(RefundType)
  type: RefundType;

  @ApiProperty({
    example: PaidFor.EVENT,
    enum: PaidFor,
    description:
      'What the refund is being requested for (EVENT | COUNSELLING | COURSE)',
  })
  @IsEnum(PaidFor)
  paidFor: PaidFor;

  @ApiProperty({
    example: 'Event was cancelled due to weather conditions',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;

  // ───────────────────────────────────────────────────────────────
  // CONDITIONAL: Required ONLY when paidFor = EVENT
  // ───────────────────────────────────────────────────────────────
  @ApiPropertyOptional({
    example: 101,
    description:
      'Required only when paidFor = EVENT. Registration ID linked to the event.',
  })
  @ValidateIf((dto) => dto.paidFor === PaidFor.EVENT)
  @IsNumber()
  registrationId?: number;

  // ───────────────────────────────────────────────────────────────
  // CONDITIONAL: Required ONLY when paidFor = COUNSELLING
  // ───────────────────────────────────────────────────────────────
  @ApiPropertyOptional({
    example: 55,
    description:
      'Required only when paidFor = COUNSELLING. Counselling booking ID linked to the refund.',
  })
  @ValidateIf((dto) => dto.paidFor === PaidFor.COUNSELLING)
  @IsNumber()
  counsellingBookingId?: number;

  // ───────────────────────────────────────────────────────────────
  // Transaction ID (optional, may be used for any type)
  // ───────────────────────────────────────────────────────────────
  // @ApiPropertyOptional({
  //   example: 777,
  //   description: 'Optional: Related transaction ID',
  // })
  // @IsOptional()
  // @IsNumber()
  // transactionId?: number;
}
