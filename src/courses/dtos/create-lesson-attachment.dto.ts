// src/modules/courses/dtos/create-lesson-attachment.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { AttachmentType } from 'src/database/entities/lesson-attachment.entity';

export class CreateLessonAttachmentDto {
  @ApiProperty({
    example: 'Worksheet PDF',
    description: 'Human-readable title for the attachment.',
    maxLength: 150,
  })
  @IsString()
  @MaxLength(150)
  title: string;

  @ApiPropertyOptional({
    enum: AttachmentType,
    example: AttachmentType.PDF,
    description: 'Optional attachment type. Defaults to OTHER if not provided.',
  })
  @IsOptional()
  @IsEnum(AttachmentType)
  type?: AttachmentType;

  /**
   * NOTE:
   * Multer provides this via @UploadedFiles(), not @Body().
   * We keep it here ONLY so Swagger shows the file input.
   */
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Attachment file to upload (required).',
  })
  file: any;
}
