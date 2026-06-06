import {
  Body,
  Controller,
  Post,
  Req,
  Get,
  Param,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { InitializePaymentDto } from './dto/initialize-payment.dto';
import { JwtGuards } from 'src/auth/jwt.guards';

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
  @UseGuards(JwtGuards)
  @ApiOperation({ summary: 'Initialize a new transaction' })
  create(@Body() dto: InitializePaymentDto, @Req() req: any) {
    return this.paymentService.initializePayment({
      email: req.user.email_address,
      amount: String(dto.amount * 100),
    });
  }

  @Get('verify-transaction/:id')
  @UseGuards(JwtGuards)
  @ApiOperation({ summary: 'Verify a payment transaction is successful' })
  async verifyPayment(@Param('id') reference: string, @Req() req: any) {
    const isVerified = await this.paymentService.verifyIfCompleted(
      reference,
      req.user.email_address,
    );
    return {
      isVerified,
      status: 200,
    };
  }

  @Post('process-payments')
  @ApiOperation({ summary: 'Processing paystack transactions' })
  @HttpCode(200)
  // @ApiExcludeEndpoint()
  async processPayment(@Req() req: any) {
    const result = await this.paymentService.verifyWebhookSignature(req);
    return {
      status: 200,
      isVerified: result.isVerified,
      message: 'Transaction Processed',
    };
  }
}
