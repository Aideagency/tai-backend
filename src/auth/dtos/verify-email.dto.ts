import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({
    example: 'sample@email.com',
  })
  @IsEmail()
  email_address: string;
}
