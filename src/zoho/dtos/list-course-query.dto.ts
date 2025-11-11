import { IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ListCoursesQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @ApiProperty({
    description: 'Page number for pagination',
    example: 1,
    required: false,
  })
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @ApiProperty({
    description: 'Number of items per page',
    example: 20,
    required: false,
  })
  pageSize?: number;

  @IsOptional()
  @IsEnum(['createdAt', 'id'])
  @ApiProperty({
    description: 'Order by field',
    example: 'id',
    enum: ['createdAt', 'id'],
    required: false,
  })
  orderBy?: 'createdAt' | 'id';

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  @ApiProperty({
    description: 'Order direction',
    example: 'ASC',
    enum: ['ASC', 'DESC'],
    required: false,
  })
  orderDir?: 'ASC' | 'DESC';
}
