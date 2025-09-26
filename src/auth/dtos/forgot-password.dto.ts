import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  //   @IsString()
  //   @ApiProperty({
  //     example: '000000',
  //   })
  //   otp: string;

  @IsString()
  @ApiProperty({
    example: 'sample@email.com',
  })
  email_address: string;
}
