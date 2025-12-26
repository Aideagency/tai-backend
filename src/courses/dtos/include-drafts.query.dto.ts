// src/courses/dto/include-drafts.query.dto.ts
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class IncludeDraftsQueryDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  includeDrafts?: boolean;
}
