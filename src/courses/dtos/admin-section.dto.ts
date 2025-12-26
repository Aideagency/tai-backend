// src/courses/admin/dto/admin-section.dto.ts
import { IsInt, IsOptional, IsString, Min, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSectionDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  lessonId: number;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  contentHtml?: string;

  @IsOptional()
  @IsUrl()
  videoUrl?: string; // youtube link

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateSectionDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  contentHtml?: string;

  @IsOptional()
  @IsUrl()
  videoUrl?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
