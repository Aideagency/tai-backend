// src/courses/admin/dtos/admin-list-courses.query.dto.ts
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  // CourseAccessType,
  PublishStatus,
} from 'src/database/entities/course.entity';

export class AdminListCoursesQueryDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Page number (1-based)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    example: 20,
    description: 'Number of courses per page',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;

  @ApiPropertyOptional({
    example: 'nutrition',
    description: 'Search term applied to course title and description',
  })
  @IsOptional()
  @IsString()
  q?: string;

  // @ApiPropertyOptional({
  //   example: CourseAccessType.PAID,
  //   enum: CourseAccessType,
  //   description: 'Filter courses by access type',
  // })
  // @IsOptional()
  // @IsEnum(CourseAccessType)
  // accessType?: CourseAccessType;

  @ApiPropertyOptional({
    example: PublishStatus.DRAFT,
    enum: PublishStatus,
    description: 'Filter courses by publish status (admin only)',
  })
  @IsOptional()
  @IsEnum(PublishStatus)
  status?: PublishStatus; // DRAFT | PUBLISHED | ARCHIVED

  @ApiPropertyOptional({
    example: true,
    description:
      'Whether to include aggregated counts (lessons, sections, enrollments)',
  })
  @IsOptional()
  @Type(() => Boolean)
  includeCounts?: boolean;

  @ApiPropertyOptional({
    example: 'createdAt',
    enum: ['createdAt', 'updatedAt', 'title', 'id'],
    description: 'Field to order results by',
  })
  @IsOptional()
  @IsIn(['createdAt', 'updatedAt', 'title', 'id'])
  orderBy?: 'createdAt' | 'updatedAt' | 'title' | 'id';

  @ApiPropertyOptional({
    example: 'DESC',
    enum: ['ASC', 'DESC'],
    description: 'Sort direction',
  })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  orderDir?: 'ASC' | 'DESC';
}
