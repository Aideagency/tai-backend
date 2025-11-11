import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EnrollUserDto {
  @ApiProperty({ description: 'User ID to enroll', example: '12345' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Course ID to enroll into', example: '67890' })
  @IsString()
  courseId: string;
}
