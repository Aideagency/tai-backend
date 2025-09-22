import { IsEmail, IsOptional, IsPhoneNumber, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'sample@email.com',
  })
  @IsEmail()
  email_address: string;

  @ApiProperty()
  password: string;

  @ApiProperty({
    example: '+2348080183735',
  })
  @IsPhoneNumber()
  phone_no: string;

  @ApiProperty()
  first_name: string;

  @ApiProperty()
  last_name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ApiProperty()
  middle_name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deviceName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deviceModel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deviceToken?: string;
}
