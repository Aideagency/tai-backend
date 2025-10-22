// src/prayerwall/dto/list-prayers.query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class ListBooksDto {
  @ApiPropertyOptional({ description: 'Filter answered state', example: false })
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined
      ? undefined
      : ['true', '1', 'yes', 'y', 'on'].includes(String(value).toLowerCase()),
  )
  @IsBoolean()
  includeSections?: boolean;

  @ApiPropertyOptional({ description: 'Filter visibility', example: false })
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined
      ? undefined
      : ['true', '1', 'yes', 'y', 'on'].includes(String(value).toLowerCase()),
  )
  @IsBoolean()
  includeChapters?: boolean;
}
