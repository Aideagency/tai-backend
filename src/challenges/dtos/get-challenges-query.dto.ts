// src/challenge/dtos/get-challenges-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import {
  ChallengeStatus,
  Visibility,
} from 'src/database/entities/challenge.entity';
import { CommunityTag as CommunityType } from 'src/database/entities/user.entity';
// import { CommunityType } from '../entities/community-type.enum'; // adjust paths
// import { ChallengeStatus } from '../entities/challenge-status.enum';
// import { Visibility } from '../entities/visibility.enum';

export class GetChallengesQueryDto {
  @ApiPropertyOptional({ description: 'Page number (1-based)', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Page size', example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;

  // filters
  @ApiPropertyOptional({
    description: 'Search text (title / description / book)',
    example: 'marriage',
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    description:
      'Community filter. Accepts single value or comma-separated/array',
    isArray: true,
    enum: CommunityType,
  })
  @IsOptional()
  @IsEnum(CommunityType, { each: true })
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;

    // ?community=FAMILY or ?community=FAMILY,YOUTH or ?community=FAMILY&community=YOUTH
    if (Array.isArray(value)) {
      return value;
    }

    return String(value)
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  })
  community?: CommunityType[]; // covers single + multiple

  @ApiPropertyOptional({ enum: ChallengeStatus })
  @IsOptional()
  @IsEnum(ChallengeStatus)
  status?: ChallengeStatus;

  @ApiPropertyOptional({ enum: Visibility })
  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;

  @ApiPropertyOptional({
    description: 'If true, shorthand for status = ACTIVE',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'boolean') return value;
    const str = String(value).toLowerCase();
    return str === 'true' || str === '1';
  })
  activeOnly?: boolean;

  // sorting
  @ApiPropertyOptional({
    description: 'Order by field',
    enum: ['createdAt', 'id', 'title', 'durationDays'],
    example: 'createdAt',
  })
  @IsOptional()
  @IsIn(['createdAt', 'id', 'title', 'durationDays'])
  orderBy?: 'createdAt' | 'id' | 'title' | 'durationDays';

  @ApiPropertyOptional({
    description: 'Sort direction',
    enum: ['ASC', 'DESC'],
    example: 'DESC',
  })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  orderDir?: 'ASC' | 'DESC';
}
