// dtos/add-member.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddMemberDto {
  @ApiProperty({
    example: '1234567890',
    description: 'The ID of the course where a member should be added',
  })
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @ApiProperty({
    example: '7896543210',
    description: 'User ID to be added as a member to the course',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;
}
