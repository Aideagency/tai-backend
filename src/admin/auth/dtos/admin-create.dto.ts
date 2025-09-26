import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';
import { AdminRole } from 'src/database/entities/admin.entity';

export class AdminCreateDto {
  @ApiProperty({
    example: 'Jane',
    description: 'The first name of the admin to be created',
  })
  @IsString({ message: 'First name must be a string' })
  @IsNotEmpty({ message: 'First name is required' })
  first_name: string;

  @ApiProperty({
    example: 'Doe',
    description: 'The last name of the admin to be created',
  })
  @IsString({ message: 'Last name must be a string' })
  @IsNotEmpty({ message: 'Last name is required' })
  last_name: string;

  @ApiProperty({
    example: 'admin.jane@example.com',
    description: 'The email address of the new admin (must be unique)',
  })
  @IsEmail({}, { message: 'Invalid email address format' })
  @IsNotEmpty({ message: 'Email is required' })
  email_address: string;

  @ApiProperty({
    example: 'Str0ngP@ssw0rd!',
    description:
      'Password for the new admin. Must be at least 8 characters long.',
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(100, { message: 'Password cannot exceed 100 characters' })
  password: string;

  @ApiPropertyOptional({
    enum: AdminRole,
    example: AdminRole.ADMIN,
    description:
      'Role of the admin. Defaults to ADMIN if not provided. Options: SUPER_ADMIN, ADMIN.',
  })
  @IsOptional()
  @IsEnum(AdminRole, {
    message: `Role must be one of: ${Object.values(AdminRole).join(', ')}`,
  })
  role?: AdminRole; // defaults to ADMIN
}
