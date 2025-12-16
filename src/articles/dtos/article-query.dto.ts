import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum ArticleOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export enum ArticleOrderBy {
  DATE = 'date',
  TITLE = 'title',
  SLUG = 'slug',
}

export class ArticlesQueryDto {
  @ApiPropertyOptional({
    description: 'Page number (1-based indexing)',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of articles per page',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  perPage?: number = 10;

  @ApiPropertyOptional({
    description: 'Search articles by title or content',
    example: 'climate',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Fetch a single article by slug',
    example: 'food-systems-in-africa',
  })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({
    description: 'Sort order of results',
    enum: ArticleOrder,
    example: ArticleOrder.DESC,
  })
  @IsOptional()
  @IsEnum(ArticleOrder)
  order?: ArticleOrder = ArticleOrder.DESC;

  @ApiPropertyOptional({
    description: 'Field to sort articles by',
    enum: ArticleOrderBy,
    example: ArticleOrderBy.DATE,
  })
  @IsOptional()
  @IsEnum(ArticleOrderBy)
  orderBy?: ArticleOrderBy = ArticleOrderBy.DATE;
}
