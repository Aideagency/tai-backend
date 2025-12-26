import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsDate,
  IsInt,
  Min,
  IsBoolean,
} from 'class-validator';
import { CounsellingBookingStatus } from 'src/database/entities/counselling-booking.entity';

// ✅ Converts undefined-ish query values to real undefined
const toUndefined = ({ value }: { value: any }) => {
  if (
    value === undefined ||
    value === null ||
    value === '' ||
    value === 'undefined' ||
    value === 'null'
  ) {
    return undefined;
  }
  return value;
};

// ✅ Parses "true"/"false" → boolean, else undefined
const toBooleanOrUndefined = ({ value }: { value: any }) => {
  const v = toUndefined({ value });
  if (v === undefined) return undefined;
  if (v === true || v === 'true') return true;
  if (v === false || v === 'false') return false;
  return undefined;
};

// ✅ Parses number safely, else undefined
const toNumberOrUndefined = ({ value }: { value: any }) => {
  const v = toUndefined({ value });
  if (v === undefined) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

// ✅ Handles ISO dates + "YYYY-MM-DD" from <input type="date">
const toDateOrUndefined = ({ value }: { value: any }) => {
  const v = toUndefined({ value });
  if (v === undefined) return undefined;

  // If it’s "YYYY-MM-DD", treat as local date start
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const [y, m, d] = v.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return isNaN(dt.getTime()) ? undefined : dt;
  }

  const dt = new Date(v);
  return isNaN(dt.getTime()) ? undefined : dt;
};

export class GetCounsellingBookingsFilterDto {
  @ApiPropertyOptional({
    description: 'Search by client name, email, or notes',
    example: 'anxiety',
  })
  @IsOptional()
  @IsString()
  @Transform(toUndefined)
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
  @Transform(toUndefined)
  status?: CounsellingBookingStatus;

  @ApiPropertyOptional({
    description: 'Filter bookings created from this date (ISO or YYYY-MM-DD)',
    example: '2025-01-01',
  })
  @IsOptional()
  @Transform(toDateOrUndefined)
  @IsDate()
  from?: Date;

  @ApiPropertyOptional({
    description: 'Filter bookings created up to this date (ISO or YYYY-MM-DD)',
    example: '2025-01-31',
  })
  @IsOptional()
  @Transform(toDateOrUndefined)
  @IsDate()
  to?: Date;

  @ApiPropertyOptional({
    description: 'Filter by counsellor adminId (if multiple counsellors exist)',
    example: 7,
  })
  @IsOptional()
  @Transform(toNumberOrUndefined)
  @IsInt()
  @Min(1)
  counsellorId?: number;

  @ApiPropertyOptional({
    description: 'Filter by user (client) id',
    example: 22,
  })
  @IsOptional()
  @Transform(toNumberOrUndefined)
  @IsInt()
  @Min(1)
  userId?: number;

  @ApiPropertyOptional({
    description: 'Filter by attendance',
    example: true,
    enum: ['true', 'false'],
  })
  @IsOptional()
  @Transform(toBooleanOrUndefined)
  @IsBoolean()
  attended?: boolean;

  // -------------------
  // Pagination
  // -------------------

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
  })
  @IsOptional()
  @Transform(({ value }) => {
    const n = Number(value);
    return Number.isFinite(n) && n >= 1 ? n : 1;
  })
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    description: 'Number of results per page',
    example: 20,
  })
  @IsOptional()
  @Transform(({ value }) => {
    const n = Number(value);
    return Number.isFinite(n) && n >= 1 ? n : 20;
  })
  @IsInt()
  @Min(1)
  pageSize: number = 20;

  // -------------------
  // Sorting
  // -------------------

  @ApiPropertyOptional({
    description: 'Field to sort by',
    example: 'createdAt',
    enum: ['createdAt', 'startsAt', 'id'],
  })
  @IsOptional()
  @Transform(({ value }) =>
    ['createdAt', 'startsAt', 'id'].includes(value) ? value : 'createdAt',
  )
  orderBy: 'createdAt' | 'startsAt' | 'id' = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort direction',
    example: 'DESC',
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @Transform(({ value }) =>
    value === 'ASC' || value === 'DESC' ? value : 'DESC',
  )
  orderDir: 'ASC' | 'DESC' = 'DESC';
}
