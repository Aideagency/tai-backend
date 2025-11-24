import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class ConfirmBookingPaymentDto {
  @ApiProperty({
    description: 'Transaction reference received from payment provider',
    example: 'PSK_98e3fb8289123A',
  })
  @IsString()
  @IsNotEmpty()
  transactionRef: string;
}
