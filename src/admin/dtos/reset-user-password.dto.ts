// src/admin/dtos/reset-user-password.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, Matches } from 'class-validator';

export class ResetUserPasswordDto {
  @ApiProperty({
    example: 'StrongPassw0rd!',
    description:
      'The new password for the user. Must be at least 8 characters long, containing letters and numbers (and preferably a special character).',
  })
  @IsString({ message: 'New password must be a string' })
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'New password must contain at least one letter and one number',
  })
  new_password: string;
}
