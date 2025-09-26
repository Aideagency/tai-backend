// src/admin/dtos/pagination.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min, IsString } from 'class-validator';

export class PaginationDto {
  @ApiPropertyOptional({
    example: 1,
    description:
      'Page number to retrieve (must be 1 or higher). Defaults to 1.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number = 1;

  @ApiPropertyOptional({
    example: 20,
    description:
      'Number of records per page (must be 1 or higher). Defaults to 20.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page size must be an integer' })
  @Min(1, { message: 'Page size must be at least 1' })
  pageSize?: number = 20;

  @ApiPropertyOptional({
    example: 'john',
    description:
      'Optional search keyword to filter results (e.g., by name or email).',
  })
  @IsOptional()
  @IsString({ message: 'Search query must be a string' })
  q?: string;
}
