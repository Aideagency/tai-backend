// dtos/list-courses-query.dto.ts
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListCoursesQueryDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Page number for paginated course listing',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    example: 20,
    description: 'Number of records per page',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({
    example: 'nutrition',
    description: 'Search keyword to filter courses',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: 'published',
    description: 'Course status filter (e.g., published, draft)',
  })
  @IsOptional()
  @IsString()
  status?: string;
}
