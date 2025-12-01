import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import {
  CounsellingMode,
  CounsellingStatus,
  CounsellingType,
} from 'src/database/entities/counselling.entity';

export class GetCounsellingsFilterDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pageSize?: number;

  @ApiPropertyOptional({
    description: 'Filter by counselling status',
    enum: CounsellingStatus,
    example: CounsellingStatus.PUBLISHED,
  })
  @IsOptional()
  @IsEnum(CounsellingStatus)
  status?: CounsellingStatus;

  @ApiPropertyOptional({
    description: 'Filter by counselling type',
    enum: CounsellingType,
    example: CounsellingType.INDIVIDUAL,
  })
  @IsOptional()
  @IsEnum(CounsellingType)
  type?: CounsellingType;

  @ApiPropertyOptional({
    description: 'Filter by session mode (online / offline)',
    enum: CounsellingMode,
    example: CounsellingMode.ONLINE,
  })
  @IsOptional()
  @IsEnum(CounsellingMode)
  mode?: CounsellingMode;

  // -----------------------------
  // BOOLEAN TRANSFORMERS
  // -----------------------------
  @ApiPropertyOptional({
    description: 'Return only active counselling offers',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Return only featured counselling offers',
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by counsellor/admin ID',
    example: 12,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  counsellorId?: number;

  @ApiPropertyOptional({
    description: 'Return only free counselling sessions',
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  freeOnly?: boolean;

  @ApiPropertyOptional({
    description: 'Return only paid counselling sessions',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  paidOnly?: boolean;

  @ApiPropertyOptional({
    description: 'Search by title or description',
    example: 'anxiety',
  })
  @IsOptional()
  @IsString()
  q?: string;
}
