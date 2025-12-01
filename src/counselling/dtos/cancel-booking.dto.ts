import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CancelBookingDto {
  @ApiProperty({
    description: 'Cancellation reason',
    example: 'I am unable to attend the session',
  })
  @IsString()
  @IsOptional()
  reason: string;
}
