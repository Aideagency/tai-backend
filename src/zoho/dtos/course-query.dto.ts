// dtos/course-url-query.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CourseUrlQueryDto {
  @ApiProperty({
    example: 'introduction-to-nutrition',
    description: 'The course URL slug used to fetch course details',
  })
  @IsString()
  @IsNotEmpty()
  courseUrl: string;
}
