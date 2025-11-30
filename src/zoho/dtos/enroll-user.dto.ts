// dtos/enroll-user.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EnrollUserDto {
  @ApiProperty({
    example: '1234567890',
    description: 'The unique Zoho course ID',
  })
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @ApiProperty({
    example: '7896543210',
    description: 'Zoho User ID to enroll in the course',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;
}
