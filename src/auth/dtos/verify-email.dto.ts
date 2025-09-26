import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @IsString()
  @ApiProperty({
    example: '000000',
  })
  otp: string;
}
