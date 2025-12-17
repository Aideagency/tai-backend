// src/modules/books/dtos/admin/create-book.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  BookAccessType,
  BookOwnershipType,
} from 'src/database/entities/book.entity';

export class CreateBookDto {
  @ApiProperty({ example: 'The Meaning of Marriage' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: 'Timothy Keller' })
  @IsString()
  @MaxLength(140)
  author: string;

  @ApiPropertyOptional({
    example: 'A practical view of marriage as a lifelong covenant...',
  })
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * FILE UPLOAD (Cover Image)
   */
  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Cover image upload (jpg/png/webp).',
  })
  coverImage?: Express.Multer.File;

  @ApiProperty({
    enum: BookOwnershipType,
    example: BookOwnershipType.IN_HOUSE,
  })
  @IsEnum(BookOwnershipType)
  ownershipType: BookOwnershipType;

  @ApiPropertyOptional({
    enum: BookAccessType,
    example: BookAccessType.PAID,
    description: 'Required when ownershipType = IN_HOUSE',
  })
  @IsOptional()
  @IsEnum(BookAccessType)
  accessType?: BookAccessType;

  /**
   * 💰 PRICE
   * Comes in as string → convert to number
   */
  @ApiPropertyOptional({
    example: 25000,
    description: 'Required when accessType = PAID',
  })
  @IsOptional()
  @Transform(({ value }) =>
    value === '' || value === null || value === undefined
      ? undefined
      : Number(value),
  )
  @IsNumber()
  @Min(0)
  price?: number;

  /**
   * 🌍 External URL
   */
  @ApiPropertyOptional({
    example: 'https://vendor.com/books/the-meaning-of-marriage',
    description: 'Required when ownershipType = EXTERNAL',
  })
  @IsOptional()
  @IsUrl()
  externalUrl?: string;

  /**
   * FILE UPLOAD (PDF)
   */
  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'PDF upload (required when ownershipType = IN_HOUSE)',
  })
  pdfFile?: Express.Multer.File;

  /**
   * 📢 Published flag
   * "true" | "false" → boolean
   */
  @ApiPropertyOptional({
    example: true,
    description: 'Whether this book is visible to non-admin users.',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isPublished?: boolean;
}
