import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsBoolean,
  IsNumber,
} from 'class-validator';
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
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
  })
  @IsOptional()
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

  @ApiPropertyOptional({
    description: 'Return only active counselling offers',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Return only featured counselling offers',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by counsellor/admin ID',
    example: 12,
  })
  @IsOptional()
  @IsNumber()
  counsellorId?: number;

  @ApiPropertyOptional({
    description: 'Return only free counselling sessions',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  freeOnly?: boolean;

  @ApiPropertyOptional({
    description: 'Return only paid counselling sessions',
    example: true,
  })
  @IsOptional()
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
