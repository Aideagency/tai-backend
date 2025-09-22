import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class InitialisePaystackPaymentDto {
  @ApiProperty({
    description: 'Amount to be charged in kobo (e.g., 5000 = N50)',
    example: 5000,
  })
  amount: number;

  @ApiProperty({
    description: 'Email of the customer',
    example: 'customer@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Channels for payment',
    example: ['card', 'bank transfer'],
  })
  @IsArray()
  @IsString({ each: true })
  channels: string[];

  @ApiProperty({
    description: 'Paystack private key',
    example: 'sk_test178272872878728728',
  })
  secret: string;

  @ApiProperty({
    description: 'Paystack reference',
    example: 'nsmsAnlslkjsj',
  })
  reference: string;

  @ApiProperty({
    description: 'Callback URL to redirect the customer after payment',
    example: 'https://example.com/callback',
    required: false,
  })
  callback_url?: string;

  @ApiProperty({
    description: 'Optional metadata for the transaction',
    required: false,
    type: Object,
  })
  metadata?: Record<string, any>;
}
