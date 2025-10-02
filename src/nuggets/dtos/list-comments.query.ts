import { IsInt, IsOptional, IsIn, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ListCommentsQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 20;

  @IsOptional()
  @IsIn(['createdAt', 'id'])
  orderBy?: 'createdAt' | 'id' = 'id';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  orderDir?: 'ASC' | 'DESC' = 'DESC';
}
