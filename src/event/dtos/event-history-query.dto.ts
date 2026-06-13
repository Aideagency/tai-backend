import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';

export type EventHistoryPeriod = 'all' | 'past' | 'upcoming';

const toPositiveNumber = (fallback: number) =>
  Transform(({ value }) => {
    const n = Number(value);
    return Number.isFinite(n) && n >= 1 ? n : fallback;
  });

const toPeriod = Transform(({ value }) => {
  if (value === 'all' || value === 'past' || value === 'upcoming') {
    return value;
  }
  return 'upcoming';
});

export class EventHistoryQueryDto {
  @ApiPropertyOptional({
    description: 'Event period to return.',
    enum: ['all', 'past', 'upcoming'],
    default: 'upcoming',
    example: 'upcoming',
  })
  @IsOptional()
  @IsIn(['all', 'past', 'upcoming'])
  @toPeriod
  period: EventHistoryPeriod = 'upcoming';

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
    description: 'Number of event registrations per page.',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @toPositiveNumber(20)
  @IsInt()
  @Min(1)
  pageSize: number = 20;
}
