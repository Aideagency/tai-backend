import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import {
  IsInt,
  IsIn,
  IsOptional,
  IsString,
  Min,
  IsBoolean,
} from 'class-validator';

export class FollowListQueryDto {
  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 20,
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize: number = 20;

  @ApiPropertyOptional({
    description: 'Sort by column',
    enum: ['created_at', 'id'],
    default: 'created_at',
  })
  @IsOptional()
  @IsIn(['created_at', 'id'])
  orderBy: 'created_at' | 'id' = 'created_at';

  @ApiPropertyOptional({
    description: 'Sort direction',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  orderDir: 'ASC' | 'DESC' = 'DESC';

  @ApiPropertyOptional({
    description:
      'Free-text search on user (first_name, last_name, email_address) of the connection',
    example: 'john',
  })
  @IsOptional()
  @IsString()
  q?: string;

  // @ApiPropertyOptional({
  //   description: 'Include PENDING follows (mainly for private/admin flows)',
  //   default: false,
  // })
  // @IsOptional()
  // @Transform(({ value }) => value === 'true' || value === true)
  // @IsBoolean()
  // includePending?: boolean = false;

  // @ApiPropertyOptional({
  //   description: 'Include soft-deleted follows',
  //   default: false,
  // })
  // @IsOptional()
  // @Transform(({ value }) => value === 'true' || value === true)
  // @IsBoolean()
  // includeDeleted?: boolean = false;
}
