import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @IsString()
  @ApiProperty({
    example: '000000',
  })
  otp: string;

  @ApiProperty({
    example: 'newPassword$123',
  })
  password: string;

  @IsString()
  @ApiProperty({
    example: 'sample@email.com',
  })
  email_address: string;
}
