import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class AdminSuperSignupDto {
  @ApiProperty({
    example: 'Super',
    description: 'Admin’s first name (required, must be a string)',
  })
  @IsString({ message: 'First name must be a string' })
  @IsNotEmpty({ message: 'First name is required' })
  @MaxLength(50, { message: 'First name cannot exceed 50 characters' })
  first_name: string;

  @ApiProperty({
    example: 'Admin',
    description: 'Admin’s last name (required, must be a string)',
  })
  @IsString({ message: 'Last name must be a string' })
  @IsNotEmpty({ message: 'Last name is required' })
  @MaxLength(50, { message: 'Last name cannot exceed 50 characters' })
  last_name: string;

  @ApiProperty({
    example: 'admin@example.com',
    description: 'Unique email address of the super admin',
  })
  @IsEmail({}, { message: 'Invalid email address format' })
  @IsNotEmpty({ message: 'Email is required' })
  email_address: string;

  @ApiProperty({
    example: 'StrongP@ssw0rd!',
    description:
      'Password for the super admin. Must be at least 8 characters long, include uppercase, lowercase, number, and special character.',
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(100, { message: 'Password cannot exceed 100 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).+$/, {
    message:
      'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  password: string;
}
