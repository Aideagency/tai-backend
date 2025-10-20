// src/prayerwall/dto/list-prayers.query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export enum ContentType {
  HTML = 'html',
  JSON = 'json',
  TEXT = 'text',
}

export class GetBookChapterDto {
  @ApiPropertyOptional({
    description: 'Chapter ID or reference',
    example: 'GEN.3',
  })
  @IsString()
  chapterId?: string;

  @ApiPropertyOptional({
    description: 'Response content type (html, json, or text)',
    enum: ContentType,
    example: ContentType.JSON,
  })
  @IsEnum(ContentType, {
    message: 'contentType must be one of: html, json, or text',
  })
  contentType: ContentType;

  @ApiPropertyOptional({
    description: 'Include notes in response',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) =>
    ['true', '1', 'yes', 'y', 'on'].includes(String(value).toLowerCase()),
  )
  @IsBoolean()
  includeNotes?: boolean;

  @ApiPropertyOptional({
    description: 'Include titles in response',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) =>
    ['true', '1', 'yes', 'y', 'on'].includes(String(value).toLowerCase()),
  )
  @IsBoolean()
  includeTitles?: boolean;

  @ApiPropertyOptional({
    description: 'Include chapter numbers',
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) =>
    ['true', '1', 'yes', 'y', 'on'].includes(String(value).toLowerCase()),
  )
  @IsBoolean()
  includeChapterNumbers?: boolean;

  @ApiPropertyOptional({ description: 'Include verse numbers', example: true })
  @IsOptional()
  @Transform(({ value }) =>
    ['true', '1', 'yes', 'y', 'on'].includes(String(value).toLowerCase()),
  )
  @IsBoolean()
  includeVerseNumbers?: boolean;

  @ApiPropertyOptional({ description: 'Include verse spans', example: true })
  @IsOptional()
  @Transform(({ value }) =>
    ['true', '1', 'yes', 'y', 'on'].includes(String(value).toLowerCase()),
  )
  @IsBoolean()
  includeVerseSpans?: boolean;
}
