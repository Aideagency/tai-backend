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
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import {
  BookAccessType,
  BookOwnershipType,
} from 'src/database/entities/book.entity';

export class CreateBookDto {
  /* ---------------- BASIC INFO ---------------- */

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

  /* ---------------- FILE UPLOADS ---------------- */

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Cover image upload (jpg/png/webp).',
  })
  coverImage?: Express.Multer.File;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'PDF upload (required when ownershipType = IN_HOUSE)',
  })
  @ValidateIf((o) => o.ownershipType === BookOwnershipType.IN_HOUSE)
  pdfFile?: Express.Multer.File;

  /* ---------------- OWNERSHIP ---------------- */

  @ApiProperty({
    enum: BookOwnershipType,
    example: BookOwnershipType.IN_HOUSE,
  })
  @IsEnum(BookOwnershipType)
  ownershipType: BookOwnershipType;

  /* ---------------- ACCESS TYPE ---------------- */

  @ApiPropertyOptional({
    enum: BookAccessType,
    example: BookAccessType.PAID,
    description: 'Required when ownershipType = IN_HOUSE',
  })
  @ValidateIf((o) => o.ownershipType === BookOwnershipType.IN_HOUSE)
  @IsEnum(BookAccessType)
  accessType?: BookAccessType;

  /* ---------------- PRICE ---------------- */

  @ApiPropertyOptional({
    example: 25000,
    description: 'Required when accessType = PAID',
  })
  @ValidateIf(
    (o) =>
      o.ownershipType === BookOwnershipType.IN_HOUSE &&
      o.accessType === BookAccessType.PAID,
  )
  @Transform(({ value }) =>
    value === '' || value === null || value === undefined
      ? undefined
      : Number(value),
  )
  @IsNumber()
  @Min(0)
  price?: number;

  /* ---------------- EXTERNAL URL ---------------- */

  @ApiPropertyOptional({
    example: 'https://vendor.com/books/the-meaning-of-marriage',
    description: 'Required when ownershipType = EXTERNAL',
  })
  @ValidateIf((o) => o.ownershipType === BookOwnershipType.EXTERNAL)
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsUrl()
  externalUrl?: string;

  /* ---------------- PUBLISHED FLAG ---------------- */

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
