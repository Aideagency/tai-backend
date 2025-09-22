import { IsEmail, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'sample@email.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty()
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
