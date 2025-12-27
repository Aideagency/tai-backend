// src/courses/dto/list-courses.query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export const ToOptionalNumber = () =>
  Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const n = Number(value);
    return Number.isNaN(n) ? undefined : n;
  });

export const ToOptionalBoolean = () =>
  Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;
    return undefined;
  });

export const ToOptionalString = () =>
  Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return String(value).trim();
  });

export class ListCoursesQueryDto {
  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsOptional()
  @ToOptionalNumber()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20, minimum: 1 })
  @IsOptional()
  @ToOptionalNumber()
  @IsInt()
  @Min(1)
  pageSize?: number;

  @ApiPropertyOptional({ example: 'prayer' })
  @IsOptional()
  @ToOptionalString()
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    description: 'Filter by free or paid courses',
    example: true,
  })
  @IsOptional()
  @ToOptionalBoolean()
  @IsBoolean()
  isFree?: boolean;

  @ApiPropertyOptional({
    enum: ['createdAt', 'updatedAt', 'title', 'id'],
    example: 'createdAt',
  })
  @IsOptional()
  @ToOptionalString()
  @IsIn(['createdAt', 'updatedAt', 'title', 'id'])
  orderBy?: 'createdAt' | 'updatedAt' | 'title' | 'id';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], example: 'DESC' })
  @IsOptional()
  @ToOptionalString()
  @IsIn(['ASC', 'DESC'])
  orderDir?: 'ASC' | 'DESC';
}
