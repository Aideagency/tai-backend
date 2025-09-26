import {
  IsEmail,
  IsOptional,
  IsString,
  IsNotEmpty,
  MinLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class LoginDto {
  @ApiProperty({ example: 'sample@email.com' })
  @IsEmail()
  @IsNotEmpty({ message: 'Email is required' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email_address: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 6 characters long' })
  @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+={}[\]|:;"'<>,.?/~`]).+$/, {
    message:
      'Password must contain at least one uppercase letter, one number, and one special character',
  })
  password: string;

  // @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deviceName?: string;

  // @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deviceModel?: string;

  // @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deviceToken?: string;
}
