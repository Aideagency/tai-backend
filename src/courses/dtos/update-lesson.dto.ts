// src/modules/courses/dtos/update-lesson.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateLessonDto {
  @ApiPropertyOptional({
    example: 'Updated lesson title',
    description: 'Optional lesson title update.',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({
    example: '<p>Updated...</p>',
    description:
      'Optional rich-text HTML description update (stored as HTML string).',
  })
  @IsOptional()
  @IsString()
  descriptionHtml?: string | null;

  @ApiPropertyOptional({
    example: 'https://www.youtube.com/watch?v=yyyyy',
    description: 'Optional YouTube video URL update.',
  })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  youtubeUrl?: string | null;

  @ApiPropertyOptional({
    example: 2,
    description: 'Optional new order index for this lesson within the course.',
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
