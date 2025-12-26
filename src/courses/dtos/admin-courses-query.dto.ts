import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { PublishStatus as CoursePublishStatus } from 'src/database/entities/course.entity';

const toUndefined = ({ value }: { value: any }) => {
  if (
    value === undefined ||
    value === null ||
    value === '' ||
    value === 'undefined' ||
    value === 'null'
  ) {
    return undefined;
  }
  return value;
};

export class AdminCoursesQueryDto {
  @ApiPropertyOptional({ description: 'Search by title', example: 'prayer' })
  @IsOptional()
  @Transform(toUndefined)
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: CoursePublishStatus })
  @IsOptional()
  @Transform(toUndefined)
  @IsEnum(CoursePublishStatus)
  status?: CoursePublishStatus;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Transform(({ value }) => {
    const n = Number(value);
    return isNaN(n) || n < 1 ? 1 : n;
  })
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Transform(({ value }) => {
    const n = Number(value);
    return isNaN(n) || n < 1 ? 20 : n;
  })
  @IsInt()
  @Min(1)
  pageSize: number = 20;

  @ApiPropertyOptional({
    enum: ['createdAt', 'updatedAt', 'id', 'title'],
    example: 'createdAt',
  })
  @IsOptional()
  @Transform(({ value }) =>
    ['createdAt', 'updatedAt', 'id', 'title'].includes(value)
      ? value
      : 'createdAt',
  )
  orderBy: 'createdAt' | 'updatedAt' | 'id' | 'title' = 'createdAt';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], example: 'DESC' })
  @IsOptional()
  @Transform(({ value }) =>
    value === 'ASC' || value === 'DESC' ? value : 'DESC',
  )
  orderDir: 'ASC' | 'DESC' = 'DESC';
}
