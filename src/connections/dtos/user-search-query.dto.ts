// src/users/dto/user-search-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  IsBoolean,
} from 'class-validator';

export class UserSearchQueryDto {
  @ApiPropertyOptional({ description: 'Search term (name/email/phone)' })
  @IsOptional()
  @IsString()
  q?: string;

  // @ApiPropertyOptional({ description: 'Filter by suspension status' })
  // @IsOptional()
  // @IsBoolean()
  // @Type(() => Boolean)
  // suspended?: boolean;

  @ApiPropertyOptional({
    description: 'Sort column',
    enum: ['createdAt', 'id'],
    default: 'id',
  })
  @IsOptional()
  @IsIn(['createdAt', 'id'])
  orderBy?: 'createdAt' | 'id' = 'id';

  @ApiPropertyOptional({
    description: 'Sort direction',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  orderDir?: 'ASC' | 'DESC' = 'DESC';

  @ApiPropertyOptional({ description: 'Page number (1-based)', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Page size', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 20;
}
