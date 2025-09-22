import { IsEmail, IsOptional, IsPhoneNumber, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserType } from 'src/database/entities/user.entity';

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
  @ApiProperty({
    enum: UserType,
    example: UserType.SINGLE,
  })
  user_type: string;

  //   @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deviceName?: string;

  //   @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deviceModel?: string;

  //   @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deviceToken?: string;
}
