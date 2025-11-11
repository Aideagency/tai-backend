import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsInt } from 'class-validator';

export class InitializePaymentDto {
  @ApiProperty({
    description: 'Amount to be payemnt in naira',
    example: 5000,
    minimum: 1000,
  })
  @IsInt()
  amount: number;

  @ApiProperty({
    description: 'Email of the customer',
    example: 'sample@email.com',
  })
  @IsString()
  email: string;

  @ApiProperty({
    description: 'Callback URL to redirect the customer after payment',
    example: 'https://example.com/callback',
    required: false,
  })
  @IsString()
  callback_url?: string;
}
