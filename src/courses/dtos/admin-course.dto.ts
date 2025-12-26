// src/courses/admin/dtos/admin-course.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsNumber, Min } from 'class-validator';
import {
  // CourseAccessType,
  PublishStatus,
} from 'src/database/entities/course.entity';

export class CreateCourseDto {
  @ApiProperty({
    example: 'Introduction to Photosynthesis',
    description: 'Course title',
  })
  @IsString()
  title: string;

  @ApiPropertyOptional({
    example: '<p>This course explains the fundamentals of photosynthesis.</p>',
    description: 'Rich-text HTML description of the course',
  })
  @IsOptional()
  @IsString()
  descriptionHtml?: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Course thumbnail image (PNG, JPG, etc.)',
  })
  thumbnail: Express.Multer.File;

  // @ApiProperty({
  //   example: CourseAccessType.FREE,
  //   enum: CourseAccessType,
  //   description: 'Whether the course is free or paid',
  // })
  // @IsEnum(CourseAccessType)
  // accessType: CourseAccessType;

  @ApiPropertyOptional({
    example: 15000,
    description: 'Course price (required if accessType = PAID)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({
    example: PublishStatus.DRAFT,
    enum: PublishStatus,
    description: 'Initial publish status of the course',
  })
  @IsOptional()
  @IsEnum(PublishStatus)
  status?: PublishStatus;
}

export class UpdateCourseDto {
  @ApiPropertyOptional({
    example: 'Advanced Photosynthesis',
    description: 'Updated course title',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    example: '<p>Updated rich-text course description.</p>',
    description: 'Updated HTML description',
  })
  @IsOptional()
  @IsString()
  descriptionHtml?: string;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'New thumbnail image (replaces existing one)',
  })
  @IsOptional()
  thumbnail?: Express.Multer.File;

  // @ApiPropertyOptional({
  //   example: CourseAccessType.PAID,
  //   enum: CourseAccessType,
  //   description: 'Change course access type',
  // })
  // @IsOptional()
  // @IsEnum(CourseAccessType)
  // accessType?: CourseAccessType;

  @ApiPropertyOptional({
    example: 20000,
    description: 'Updated course price',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;
}
