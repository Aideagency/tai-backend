import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';

export type BookingHistoryPeriod = 'all' | 'past' | 'upcoming';

const toPositiveNumber = (fallback: number) =>
  Transform(({ value }) => {
    const n = Number(value);
    return Number.isFinite(n) && n >= 1 ? n : fallback;
  });

const toPeriod = Transform(({ value }) => {
  if (value === 'past' || value === 'upcoming' || value === 'all') {
    return value;
  }
  return 'all';
});

export class BookingHistoryQueryDto {
  @ApiPropertyOptional({
    description: 'Booking period to return.',
    enum: ['all', 'past', 'upcoming'],
    default: 'all',
    example: 'upcoming',
  })
  @IsOptional()
  @IsIn(['all', 'past', 'upcoming'])
  @toPeriod
  period: BookingHistoryPeriod = 'all';

  @ApiPropertyOptional({
    description: 'Page number for pagination.',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @toPositiveNumber(1)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    description: 'Number of bookings per page.',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @toPositiveNumber(20)
  @IsInt()
  @Min(1)
  pageSize: number = 20;

  @ApiPropertyOptional({
    description: 'Filter history to bookings under a specific counselling plan.',
    example: 12,
  })
  @IsOptional()
  @toPositiveNumber(0)
  @IsInt()
  @Min(1)
  counsellingId?: number;
}
