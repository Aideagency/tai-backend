// src/prayerwall/dto/list-prayers.query.dto.ts
import { ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  IsDateString,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

// allowed sort fields
export const PRAYER_ORDER_BY = [
  'createdAt',
  'lastActivityAt',
  'amenCount',
  'commentCount',
  'shareCount',
  'id',
] as const;
export type PrayerOrderBy = (typeof PRAYER_ORDER_BY)[number];

export class ListPrayersQueryDto {
  @ApiPropertyOptional({ minimum: 1, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;

  @ApiPropertyOptional({
    description: 'Free-text search on title/body',
    maxLength: 200,
    example: 'healing',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  q?: string;

  @ApiPropertyOptional({ description: 'Filter answered state', example: true })
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined
      ? undefined
      : ['true', '1', 'yes', 'y', 'on'].includes(String(value).toLowerCase()),
  )
  @IsBoolean()
  isAnswered?: boolean;

  @ApiPropertyOptional({ description: 'Filter visibility', example: true })
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined
      ? undefined
      : ['true', '1', 'yes', 'y', 'on'].includes(String(value).toLowerCase()),
  )
  @IsBoolean()
  isVisible?: boolean;

  @ApiPropertyOptional({
    description: 'Created at from (ISO 8601)',
    example: '2025-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'Created at to (ISO 8601)',
    example: '2025-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({
    enum: PRAYER_ORDER_BY,
    example: 'id',
    default: 'id',
  })
  @IsOptional()
  @IsIn(PRAYER_ORDER_BY as unknown as string[])
  orderBy?: PrayerOrderBy;

  @ApiPropertyOptional({
    enum: ['ASC', 'DESC'],
    example: 'DESC',
    default: 'DESC',
  })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  orderDir?: 'ASC' | 'DESC';
}

export class LatestPrayersQueryDto extends OmitType(ListPrayersQueryDto, [
  'orderBy',
  'orderDir',
] as const) {}
