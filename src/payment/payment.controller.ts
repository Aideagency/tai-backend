import { Body, Controller, Post, Req } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { ApiOperation } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Create a new prayer' })
  create(@Body() dto: InitializePaymentDto, @Req() req: any) {
    // return this.paymentService.initializePayment({
    //   email: 'bmubarak88@gmail.com',
    //   amount: '10000',
    // });
    // return this.service.createPrayer(dto, this.getUserId(req));
  }
}
