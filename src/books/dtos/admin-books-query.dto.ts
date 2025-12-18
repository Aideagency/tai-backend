// src/modules/books/dtos/admin/admin-books-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';
import {
  BookAccessType,
  BookOwnershipType,
} from 'src/database/entities/book.entity';

export class AdminBooksQueryDto {
  @ApiPropertyOptional({ example: 1, description: 'Page number (1-indexed)' })
  @IsOptional()
  @Transform(({ value }) =>
    value === '' || value == null ? undefined : Number(value),
  )
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20, description: 'Items per page' })
  @IsOptional()
  @Transform(({ value }) =>
    value === '' || value == null ? undefined : Number(value),
  )
  @IsInt()
  @Min(1)
  pageSize?: number;

  @ApiPropertyOptional({
    example: 'marriage',
    description: 'Search title/author/slug',
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() === ''
      ? undefined
      : value?.trim(),
  )
  @IsString()
  q?: string;

  @ApiPropertyOptional({ example: true, description: 'Only published books' })
  @IsOptional()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : undefined,
  )
  @IsBoolean()
  publishedOnly?: boolean;

  /* ---------------- OWNERSHIP TYPE ---------------- */

  @ApiPropertyOptional({
    enum: BookOwnershipType,
    example: BookOwnershipType.IN_HOUSE,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value == null ? undefined : value))
  @IsEnum(BookOwnershipType, {
    message: 'ownershipType must be a valid BookOwnershipType',
  })
  ownershipType?: BookOwnershipType;

  /* ---------------- ACCESS TYPE ---------------- */

  @ApiPropertyOptional({
    enum: BookAccessType,
    example: BookAccessType.PAID,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value == null ? undefined : value))
  @ValidateIf((o) => o.ownershipType === BookOwnershipType.IN_HOUSE)
  @IsEnum(BookAccessType, {
    message: 'accessType must be a valid BookAccessType',
  })
  accessType?: BookAccessType;

  /* ---------------- SORTING ---------------- */

  @ApiPropertyOptional({
    example: 'createdAt',
    enum: ['createdAt', 'id', 'title'],
  })
  @IsOptional()
  @IsIn(['createdAt', 'id', 'title'])
  orderBy?: 'createdAt' | 'id' | 'title';

  @ApiPropertyOptional({ example: 'DESC', enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  orderDir?: 'ASC' | 'DESC';
}
