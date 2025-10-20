// src/bible/dto/search-bible.query.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

export enum SearchSort {
  RELEVANCE = 'relevance',
  CANONICAL = 'canonical', // common alternative; keep/update to match your API’s supported sorts
  REVERSECANON = 'reverse-canonical',
}

export class SearchBibleQueryDto {
  @ApiProperty({
    description: 'Search term',
    example: 'paul',
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({
    description: 'Max results to return',
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined ? 10 : Number.parseInt(String(value), 10),
  )
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Result offset (for pagination)',
    example: 20,
    default: 0,
    minimum: 0,
  })
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined ? 0 : Number.parseInt(String(value), 10),
  )
  @IsInt()
  @Min(0)
  offset?: number = 0;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: SearchSort,
    example: SearchSort.RELEVANCE,
    default: SearchSort.RELEVANCE,
  })
  @IsOptional()
  @IsIn(Object.values(SearchSort))
  sort?: SearchSort = SearchSort.RELEVANCE;

  @ApiPropertyOptional({
    description:
      'Fuzziness level for matching. Accepts "AUTO" or edit distance 0–2.',
    examples: ['AUTO', 0, 1, 2],
    oneOf: [
      { type: 'string', enum: ['AUTO'] },
      { type: 'number', minimum: 0, maximum: 2 },
      { type: 'string', pattern: '^(0|1|2)$' },
    ],
    default: 'AUTO',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined) return 'AUTO';
    const v = String(value).toUpperCase();
    if (v === 'AUTO') return 'AUTO';
    const n = Number(v);
    return Number.isInteger(n) ? n : 'AUTO';
  })
  @Matches(/^(AUTO|0|1|2)$/i, {
    message: 'fuzziness must be "AUTO" or a number 0, 1, or 2',
  })
  fuzziness?: 'AUTO' | 0 | 1 | 2 = 'AUTO';
}
