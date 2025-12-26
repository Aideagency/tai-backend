// src/courses/dto/list-courses.query.dto.ts
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import {} from 'src/database/entities/course.entity';

export class ListCoursesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsBoolean()
  accessType?: false;

  @IsOptional()
  @IsIn(['createdAt', 'updatedAt', 'title', 'id'])
  orderBy?: 'createdAt' | 'updatedAt' | 'title' | 'id';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  orderDir?: 'ASC' | 'DESC';
}
