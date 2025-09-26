// src/admin/dtos/suspend-user.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class SuspendUserDto {
  @ApiProperty({
    example: 'Violation of community guidelines: abusive language in comments',
    description:
      'The reason why the user account is being suspended. Must be a clear, descriptive statement (min 10 characters, max 255 characters).',
  })
  @IsString({ message: 'Reason must be a string' })
  @MinLength(10, {
    message: 'Reason must be at least 10 characters long',
  })
  @MaxLength(255, {
    message: 'Reason must not exceed 255 characters',
  })
  reason: string;
}
