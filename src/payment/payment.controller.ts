import { Body, Controller, Post, Req, Get, Param, HttpCode } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { InitializePaymentDto } from './dto/initialize-payment.dto';

@Controller('payment')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    // private readonly activityLogRepository: ActivityLogRepository,
    // private readonly configService: ConfigService,
  ) {
    // this.logger.setContext(PaystackService.name);
  }

  @Post('initialize')
  @ApiOperation({ summary: 'Initialize a new transaction' })
  create(@Body() dto: InitializePaymentDto, @Req() req: any) {
    console.log(dto);
    return this.paymentService.initializePayment({
      email: dto.email,
      amount: String(dto.amount * 100),
    });
  }

  @Get('verify-transaction/:id')
  @ApiOperation({ summary: 'Verify a payment transaction' })
  verifyPayment(@Param('id') reference: string) {
    return this.paymentService.verifyPayment(reference);
  }

  @Post('process-payments')
  @ApiOperation({ summary: 'Processing paystack transactions' })
  @HttpCode(200)
  // @ApiExcludeEndpoint()
  async processPayment(@Req() req: any) {
    await this.paymentService.verifyWebhookSignature(req);
    return {
      status: 200,
      message: 'Transaction Processed',
    };
  }
}
