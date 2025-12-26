// src/modules/courses/dtos/create-lesson.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateLessonDto {
  @ApiProperty({
    example: 'Lesson 1: Foundations',
    description: 'Lesson title. Required.',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({
    example: '<p>Intro...</p><ul><li>What you will learn</li></ul>',
    description:
      'Optional rich-text HTML description for the lesson (stored as HTML string).',
  })
  @IsOptional()
  @IsString()
  descriptionHtml?: string | null;

  @ApiPropertyOptional({
    example: 'https://www.youtube.com/watch?v=xxxxx',
    description: 'Optional YouTube video URL for the lesson.',
  })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  youtubeUrl?: string | null;

  @ApiPropertyOptional({
    example: 1,
    description:
      'Optional lesson order within the course. If omitted, service should append to the end.',
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
