import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdatePrayerDto {
  @ApiPropertyOptional({
    description: 'Short headline shown in lists (keep it crisp).',
    maxLength: 160,
    example: 'Healing for my sister',
  })
  @IsOptional()
  @IsString({ message: 'Title must be a string.' })
  @MaxLength(160, { message: 'Title must be at most 160 characters.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title?: string;

  @ApiPropertyOptional({
    description:
      'Main prayer text (1–2 sentences). Optional on update; if provided, it cannot be empty.',
    minLength: 1,
    maxLength: 1200,
    example:
      'Please pray for a successful surgery next week and a smooth recovery.',
  })
  @IsOptional()
  @IsString({ message: 'Body must be a string.' })
  @MinLength(1, { message: 'Body cannot be empty when provided.' })
  @MaxLength(1200, { message: 'Body must be at most 1200 characters.' })
  @IsNotEmpty({ message: 'Body cannot be empty when provided.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  body?: string;

  @ApiPropertyOptional({
    description: 'Toggle visibility (soft hide/show).',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'isVisible must be a boolean.' })
  isVisible?: boolean;

  @ApiPropertyOptional({
    description:
      'Mark as answered (service will set/clear answeredAt accordingly).',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'isAnswered must be a boolean.' })
  isAnswered?: boolean;
}
