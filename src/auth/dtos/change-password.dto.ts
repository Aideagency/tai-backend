import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @IsString()
  @ApiProperty({
    example: 'newPassword$123',
  })
  new_password: string;

  @IsString()
  @ApiProperty({
    example: 'newPassword$123',
  })
  old_password: string;
}
