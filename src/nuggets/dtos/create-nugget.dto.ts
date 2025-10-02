// src/nugget/dto/create-nugget.dto.ts
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NuggetType } from 'src/database/entities/nugget.entity';

/** Trim + collapse internal whitespace for free-text inputs. */
function sanitizeString() {
  return Transform(({ value }) =>
    typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : value,
  );
}

export class CreateNuggetDto {
  @ApiPropertyOptional({
    description: 'Optional short headline for the nugget.',
    example: 'Morning Focus',
    maxLength: 80,
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'title must be a string.' })
  @MinLength(3, { message: 'title should be at least 3 characters.' })
  @MaxLength(80, { message: 'title should be at most 80 characters.' })
  @sanitizeString()
  title?: string;

  @ApiProperty({
    description:
      'The nugget content (1–2 sentences). Keep it short, actionable, and uplifting.',
    example:
      'Start your day with gratitude—write down one thing you’re thankful for today.',
    maxLength: 280,
  })
  @IsString({ message: 'body must be a string of text.' })
  @IsNotEmpty({ message: 'body cannot be empty.' })
  @MinLength(10, { message: 'body should be at least 10 characters long.' })
  @MaxLength(280, {
    message: 'body should be at most 280 characters (1–2 short sentences).',
  })
  @sanitizeString()
  body: string;

  @ApiProperty({
    description:
      'Audience / community segment for this nugget. Use GENERAL to reach everyone.',
    enum: NuggetType,
    enumName: 'NuggetType',
    example: NuggetType.GENERAL,
  })
  @IsEnum(NuggetType, {
    message: 'nuggetType must be one of: GENERAL, SINGLE, MARRIED, PARENT.',
  })
  nuggetType: NuggetType;

  @ApiPropertyOptional({
    description:
      'Optional scheduled publish time in ISO 8601 (UTC). If omitted, the nugget is available immediately.',
    example: '2025-10-01T06:30:00.000Z',
    type: String,
    format: 'date-time',
    nullable: true,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'publishAt must be a valid ISO 8601 date-time.' })
  publishAt?: Date | null;
}
