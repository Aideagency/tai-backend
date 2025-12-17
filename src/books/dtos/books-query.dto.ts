// src/modules/books/dtos/books-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  BookAccessType,
  BookOwnershipType,
} from 'src/database/entities/book.entity';

export class BooksQueryDto {
  @ApiPropertyOptional({ example: 1, description: 'Page number (1-based)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, description: 'Items per page' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  pageSize?: number = 10;

  @ApiPropertyOptional({
    example: 'marriage',
    description: 'Search by title/author/slug',
  })
  @IsString()
  @IsOptional()
  q?: string;

  @ApiPropertyOptional({
    enum: BookOwnershipType,
    example: BookOwnershipType.IN_HOUSE,
    description: 'Filter by ownership type',
  })
  @IsEnum(BookOwnershipType)
  @IsOptional()
  ownershipType?: BookOwnershipType;

  @ApiPropertyOptional({
    enum: BookAccessType,
    example: BookAccessType.FREE,
    description: 'Filter by access type (only relevant to IN_HOUSE books)',
  })
  @IsEnum(BookAccessType)
  @IsOptional()
  accessType?: BookAccessType;

  @ApiPropertyOptional({
    example: true,
    description: 'If true, return only books the user has downloaded',
  })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  downloadedOnly?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'If true, show only published books (user-facing default)',
  })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  publishedOnly?: boolean = true;

  @ApiPropertyOptional({
    example: 'createdAt',
    description: 'Sort field',
  })
  @IsOptional()
  orderBy?: 'createdAt' | 'title' | 'id';

  @ApiPropertyOptional({
    example: 'DESC',
    description: 'Sort direction',
  })
  @IsOptional()
  orderDir?: 'ASC' | 'DESC';
}
