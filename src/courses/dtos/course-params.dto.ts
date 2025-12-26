// src/courses/dto/course-params.dto.ts
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class CourseIdParamDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  courseId: number;
}

export class CourseSectionParamDto extends CourseIdParamDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sectionId: number;
}
