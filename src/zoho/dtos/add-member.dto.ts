import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AddMemberDto {
  @ApiProperty({ description: 'User ID to add as member', example: '12345' })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'Course ID to add the member to',
    example: '67890',
  })
  @IsString()
  courseId: string;
}
