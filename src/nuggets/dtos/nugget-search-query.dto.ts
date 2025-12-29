// src/nugget/dto/nugget-search-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { NuggetType } from 'src/database/entities/nugget.entity';

export class NuggetSearchQueryDto {
  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page must be an integer.' })
  @Min(1, { message: 'page must be at least 1.' })
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'pageSize must be an integer.' })
  @Min(1, { message: 'pageSize must be at least 1.' })
  pageSize?: number = 20;

  @ApiPropertyOptional({
    description: 'Free-text search on nugget body',
    example: 'gratitude',
  })
  @IsOptional()
  @IsString({ message: 'q must be a string.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  q?: string;

  @ApiPropertyOptional({
    description: 'Filter by nugget audience/type',
    enum: NuggetType,
    enumName: 'NuggetType',
    example: NuggetType.GENERAL,
  })
  @IsOptional()
  @IsEnum(NuggetType, {
    message: 'nuggetType must be one of: GENERAL, SINGLE, MARRIED, PARENT.',
  })
  nuggetType?: NuggetType;
}
