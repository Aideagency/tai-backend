// src/dto/get-posts.dto.ts
import { IsEnum, IsInt, IsOptional, IsString, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CommunityTag } from 'src/database/entities/user.entity';

export class GetPostsDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination. Starts from 1.',
    example: 1,
  })
  @IsInt({ message: 'Page must be an integer.' })
  @IsOptional()
  @Min(1, { message: 'Page must be greater than or equal to 1.' })
  @Type(() => Number) // 👈 Converts query param string -> number
  page?: number;

  @ApiPropertyOptional({ description: 'Number of posts per page.', example: 10 })
  @IsInt({ message: 'Page size must be an integer.' })
  @IsOptional()
  @Min(1, { message: 'Page size must be greater than or equal to 1.' })
  @Max(100, { message: 'Page size must not exceed 100.' })
  @Type(() => Number) // 👈 Converts query param string -> number
  pageSize?: number;

  @ApiPropertyOptional({
    description: 'Search query to filter posts.',
    example: '',
  })
  @IsString({ message: 'Search query must be a string.' })
  @IsOptional()
  q?: string;

  @ApiPropertyOptional({
    description: 'Filter posts by community.',
    enum: CommunityTag,
    example: CommunityTag.MARRIED,
  })
  @IsEnum(CommunityTag)
  @IsOptional()
  community?: CommunityTag;
}
