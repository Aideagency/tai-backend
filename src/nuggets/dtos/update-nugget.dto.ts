// src/nugget/dtos/update-nugget.dto.ts
import {
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { NuggetType } from 'src/database/entities/nugget.entity';
import { sanitizeString } from './create-nugget.dto';

export class UpdateNuggetDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  @sanitizeString()
  title?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(280)
  // keep sanitizeString if you still want to trim/collapse whitespace
  @sanitizeString()
  body?: string;

  @IsOptional()
  @IsEnum(NuggetType)
  nuggetType?: NuggetType;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  publishAt?: Date | null;
}
