import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreatePrayerDto {
  @ApiPropertyOptional({
    description: 'Short headline shown in lists (keep it crisp).',
    maxLength: 160,
    example: 'Healing for my sister',
  })
  @IsOptional()
  @IsString({ message: 'Title must be a string.' })
  @MaxLength(160, { message: 'Title must be at most 160 characters.' })
  title?: string;

  @ApiProperty({
    description:
      'Main prayer text (1–2 sentences). This field is required. Avoid sharing sensitive personal data.',
    minLength: 1,
    maxLength: 1200,
    example:
      'Please pray for a successful surgery next week and a smooth recovery.',
  })
  @IsString({ message: 'Body must be a string.' })
  @MinLength(1, { message: 'Body cannot be empty.' })
  @MaxLength(1200, { message: 'Body must be at most 1200 characters.' })
  @IsNotEmpty({ message: 'Body is required.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  body!: string;
}
