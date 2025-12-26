// src/courses/admin/dto/reorder.dto.ts
import { Type } from 'class-transformer';
import { IsArray, IsInt, Min, ValidateNested } from 'class-validator';

class ReorderItemDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder: number;
}

export class ReorderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderItemDto)
  items: ReorderItemDto[];
}
