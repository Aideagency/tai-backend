import {
  Controller,
  Post,
  Param,
  Body,
  Put,
  Get,
  UseInterceptors,
  UploadedFile,
  Req,
  Query,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiExcludeEndpoint,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';

import { CounsellingService } from './counselling.service';
import { JwtGuards } from 'src/auth/jwt.guards';

import { CounsellingEntity } from 'src/database/entities/counselling.entity';
import { ConfirmBookingPaymentDto } from './dtos/confirm-payment-booking.dto';
import { BookCounsellingDto } from './dtos/book-counselling.dto';
import { GetCounsellingsFilterDto } from './dtos/get-counselling-filter.dto';
import { UpdateCounsellingDto } from './dtos/update-counselling.dto';
import { CreateCounsellingDto } from './dtos/create-counselling.dto';
import { CancelBookingDto } from './dtos/cancel-booking.dto';
import { RescheduleBookingDto } from './dtos/reshedule-booking.dto';
import { AdminJwtGuard } from 'src/admin/auth/admin-jwt.guard';
import { BookingHistoryQueryDto } from './dtos/booking-history-query.dto';

@ApiTags('counselling')
@Controller('counselling')
export class CounsellingController {
  constructor(private readonly counsellingService: CounsellingService) {}

  /** ───── Counselling CRUD ───── */

  @Post('create')
  @UseInterceptors(FileInterceptor('coverUrl'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Create a counselling offer with optional cover image upload',
    type: CreateCounsellingDto,
  })
  @ApiResponse({ status: 201, description: 'Counselling offer created.' })
  @ApiExcludeEndpoint()
  async createCounselling(
    @Body() dto: CreateCounsellingDto,
    @UploadedFile() coverUrl: Express.Multer.File,
  ) {
    const counselling = await this.counsellingService.createCounselling(
      dto as any,
      coverUrl,
    );
    return counselling;
  }

  @Put('update/:id')
  @UseInterceptors(FileInterceptor('coverUrl'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Update a counselling offer with optional cover image upload',
    type: UpdateCounsellingDto,
  })
  @ApiResponse({ status: 200, description: 'Counselling offer updated.' })
  @ApiExcludeEndpoint()
  async updateCounselling(
    @Param('id') id: number,
    @Body() dto: UpdateCounsellingDto,
    @UploadedFile() coverUrl: Express.Multer.File,
  ) {
    return this.counsellingService.updateCounselling(id, dto as any, coverUrl);
  }

  @Delete('delete/:id')
  @ApiExcludeEndpoint()
  async deleteCounselling(@Param('id') id: number) {
    return this.counsellingService.deleteCounselling(id);
  }

  @Get('detailed/:counsellingId')
  @ApiExcludeEndpoint()
  async fetchDetailedCounselling(
    @Param('counsellingId') counsellingId: number,
  ) {
    return this.counsellingService.getDetailedCounsellingById(counsellingId);
  }

  @UseGuards(JwtGuards)
  @Get('all')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Gel all counselling offers with optional filters',
  })
  async fetchCounsellings(@Query() query: GetCounsellingsFilterDto) {
    return this.counsellingService.getAllCounsellings(query);
  }

  @UseGuards(JwtGuards)
  @Get('my-bookings/:counsellingId')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get my booking information under a counselling plan',
  })
  async fetchBooks(
    @Param('counsellingId') counsellingId: number,
    @Req() req: any,
  ) {
    return this.counsellingService.getUserBookings(req.user.id, counsellingId);
  }

  @UseGuards(JwtGuards)
  @Get('bookings/history')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get my counselling booking history',
    description:
      "Returns the logged-in user's counselling bookings. Use period=all, period=past, or period=upcoming to filter the history.",
  })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['all', 'past', 'upcoming'],
    description: 'Filter booking history by time period. Defaults to all.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination. Defaults to 1.',
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    description: 'Number of bookings per page. Defaults to 20.',
  })
  @ApiQuery({
    name: 'counsellingId',
    required: false,
    type: Number,
    description:
      'Optional counselling plan ID. When provided, only bookings for that counselling plan are returned.',
  })
  @ApiOkResponse({
    description: 'Counselling booking history fetched successfully.',
  })
  async getMyBookingHistory(
    @Req() req: any,
    @Query() query: BookingHistoryQueryDto,
  ) {
    return this.counsellingService.getUserBookingHistory(req.user.id, query);
  }

  @UseGuards(AdminJwtGuard)
  @Get('admin/:counsellingId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get counselling information' })
  async fetchCounsellingAdmin(@Param('counsellingId') counsellingId: number) {
    return this.counsellingService.getCounsellingById(counsellingId);
  }

  @UseGuards(JwtGuards)
  @Get(':counsellingId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get counselling information' })
  async fetchCounselling(@Param('counsellingId') counsellingId: number) {
    return this.counsellingService.getCounsellingById(counsellingId);
  }

  /** ───── Bookings ───── */

  @UseGuards(JwtGuards)
  @Post('book/:counsellingId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Book a session' })
  async bookCounselling(
    @Param('counsellingId') counsellingId: number,
    @Body() body: BookCounsellingDto,
    @Req() req: any,
  ) {
    return this.counsellingService.bookCounselling(req, counsellingId, body);
  }

  @UseGuards(JwtGuards)
  @Put('book/:bookingId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reschedule a session' })
  async rescheduleCounselling(
    @Param('bookingId') bookingId: number,
    @Body() body: RescheduleBookingDto,
    @Req() req: any,
  ) {
    return this.counsellingService.rescheduleBooking(
      bookingId,
      req.user.id,
      body,
    );
  }

  // Update a booking (e.g., by admin or counsellor)
  @UseGuards(JwtGuards)
  @Put('booking/:bookingId')
  @ApiBearerAuth()
  @ApiExcludeEndpoint()
  async updateBooking(
    @Param('bookingId') bookingId: number,
    @Body() updateData: Partial<CounsellingEntity>, // or a dedicated UpdateBookingDto
  ) {
    return this.counsellingService.updateBooking(bookingId, updateData as any);
  }

  // Confirm booking payment by id + transactionRef (internal/admin endpoint)
  @UseGuards(AdminJwtGuard)
  @Post('booking/confirm/:bookingId')
  @ApiBearerAuth()
  @ApiExcludeEndpoint()
  async confirmBookingPayment(
    @Param('bookingId') bookingId: number,
    @Body() body: ConfirmBookingPaymentDto, // { transactionRef: string }
  ) {
    return this.counsellingService.confirmPayment(
      bookingId,
      body.transactionRef,
    );
  }

  // Cancel a booking (user)
  @UseGuards(JwtGuards)
  @Post('booking/cancel/:bookingId')
  @ApiBearerAuth()
  async cancelBooking(
    @Param('bookingId') bookingId: number,
    @Req() req: any,
    @Body() body: CancelBookingDto,
  ) {
    return this.counsellingService.cancelBooking({
      bookingId,
      userId: req.user.id,
      reason: body.reason,
    });
  }

  // All bookings for a counselling offer (e.g. for admin dashboard)
  @UseGuards(JwtGuards)
  @Get(':counsellingId/bookings')
  @ApiBearerAuth()
  async getCounsellingBookings(@Param('counsellingId') counsellingId: number) {
    return this.counsellingService.getCounsellingBookings(counsellingId);
  }

  // Find booking by transaction reference
  @UseGuards(AdminJwtGuard)
  @Get('booking/find/:reference')
  @ApiBearerAuth()
  @ApiExcludeEndpoint()
  async findBookingByReference(@Param('reference') reference: string) {
    return this.counsellingService.findBookingByRef(reference);
  }

  @UseGuards(AdminJwtGuard)
  @Get('booking/:id/find')
  @ApiBearerAuth()
  @ApiExcludeEndpoint()
  async findBookingById(@Param('id') id: number) {
    return this.counsellingService.getBooking(id);
  }

  /** ───── Payment webhook / async confirmation ───── */

  // Simple endpoint to handle async payment confirmation
  // (could be called from a payment webhook controller as well)
  @UseGuards(JwtGuards)
  @Post('payment/confirm')
  @ApiExcludeEndpoint()
  async handlePaymentConfirmation(
    @Body()
    body: {
      reference: string;
    },
  ) {
    await this.counsellingService.confirmVerifiedPaymentReference(
      body.reference,
    );
    return { message: 'Payment confirmation processed' };
  }
}
