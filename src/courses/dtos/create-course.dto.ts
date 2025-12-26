import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PublishStatus as CoursePublishStatus } from 'src/database/entities/course.entity';

const emptyToUndefined = ({ value }: { value: any }) => {
  if (value === '' || value === null) return undefined;
  return value;
};

const toBoolean = ({ value }: { value: any }) => {
  if (value === '' || value === null || value === undefined) return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return Boolean(value);
};

const toNumber = ({ value }: { value: any }) => {
  if (value === '' || value === null || value === undefined) return undefined;
  if (typeof value === 'number') return value;
  const n = Number(value);
  return Number.isNaN(n) ? value : n; // keep original so validator can fail properly
};

export class CreateCourseDto {
  @ApiProperty({ example: 'Introduction to Prayer' })
  @Transform(emptyToUndefined)
  @IsString()
  title: string;

  @ApiPropertyOptional({
    description: 'Rich text HTML',
    example: '<p>Welcome to this course...</p>',
  })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  descriptionHtml?: string;

  /**
   * File upload. Not validated with class-validator.
   * Multer provides it via @UploadedFiles().
   */
  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Course thumbnail image (uploaded file)',
  })
  @IsOptional()
  thumbnail?: any;

  @ApiPropertyOptional({
    description: 'If true, price is ignored and set to null',
    example: true,
  })
  @Transform(toBoolean)
  @IsOptional()
  @IsBoolean()
  isFree?: boolean;

  @ApiPropertyOptional({
    description: 'Required when isFree is false',
    example: 5000,
  })
  @Transform(toNumber)
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ example: 'NGN' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({
    enum: CoursePublishStatus,
    example: CoursePublishStatus.DRAFT,
  })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsEnum(CoursePublishStatus)
  status?: CoursePublishStatus;
}
