import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';

export class AdminLoginDto {
  @ApiProperty({
    example: 'admin@example.com',
    description:
      'The email address of the admin (must be valid and registered)',
  })
  @IsEmail({}, { message: 'Invalid email address format' })
  @IsNotEmpty({ message: 'Email is required' })
  email_address: string;

  @ApiProperty({
    example: 'StrongP@ssw0rd!',
    description:
      'The password of the admin. Must be at least 8 characters long.',
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(100, { message: 'Password cannot exceed 100 characters' })
  password: string;
}
