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
//   @ApiExcludeEndpoint()
  async createCounselling(
    @Body() dto: CreateCounsellingDto,
    @UploadedFile() coverUrl: Express.Multer.File,
  ) {
    if (coverUrl) {
      dto.coverUrl = coverUrl.path; // or your storage URL
    }

    const counselling = await this.counsellingService.createCounselling(
      dto as any,
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
//   @ApiExcludeEndpoint()
  async updateCounselling(
    @Param('id') id: number,
    @Body() dto: UpdateCounsellingDto,
    @UploadedFile() coverUrl: Express.Multer.File,
  ) {
    if (coverUrl) {
      dto.coverUrl = coverUrl.path;
    }
    return this.counsellingService.updateCounselling(id, dto as any);
  }

  @Delete('delete/:id')
//   @ApiExcludeEndpoint()
  async deleteCounselling(@Param('id') id: number) {
    return this.counsellingService.deleteCounselling(id);
  }

  @Get('detailed/:counsellingId')
//   @ApiExcludeEndpoint()
  async fetchDetailedCounselling(
    @Param('counsellingId') counsellingId: number,
  ) {
    return this.counsellingService.getDetailedCounsellingById(counsellingId);
  }

  @UseGuards(JwtGuards)
  @Get('all')
  @ApiBearerAuth()
  async fetchCounsellings(@Query() query: GetCounsellingsFilterDto) {
    return this.counsellingService.getAllCounsellings(query);
  }

  @UseGuards(JwtGuards)
  @Get(':counsellingId')
  @ApiBearerAuth()
  async fetchCounselling(@Param('counsellingId') counsellingId: number) {
    return this.counsellingService.getCounsellingById(counsellingId);
  }

  /** ───── Bookings ───── */

  @UseGuards(JwtGuards)
  @Post('book/:counsellingId')
  @ApiBearerAuth()
  async bookCounselling(
    @Param('counsellingId') counsellingId: number,
    @Body() body: BookCounsellingDto,
    @Req() req: any,
  ) {
    return this.counsellingService.bookCounselling(req, counsellingId, body);
  }

  // Update a booking (e.g., by admin or counsellor)
  @UseGuards(JwtGuards)
  @Put('booking/:bookingId')
  @ApiBearerAuth()
//   @ApiExcludeEndpoint()
  async updateBooking(
    @Param('bookingId') bookingId: number,
    @Body() updateData: Partial<CounsellingEntity>, // or a dedicated UpdateBookingDto
  ) {
    return this.counsellingService.updateBooking(bookingId, updateData as any);
  }

  // Confirm booking payment by id + transactionRef (internal/admin endpoint)
  @UseGuards(JwtGuards)
  @Post('booking/confirm/:bookingId')
  @ApiBearerAuth()
//   @ApiExcludeEndpoint()
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
  async cancelBooking(@Param('bookingId') bookingId: number, @Req() req: any) {
    return this.counsellingService.cancelBooking(bookingId, req.user.id);
  }

  // All bookings for a counselling offer (e.g. for admin dashboard)
  @UseGuards(JwtGuards)
  @Get(':counsellingId/bookings')
  @ApiBearerAuth()
  async getCounsellingBookings(@Param('counsellingId') counsellingId: number) {
    return this.counsellingService.getCounsellingBookings(counsellingId);
  }

  // Find booking by transaction reference
  @Get('booking/find/:reference')
  async findBookingByReference(@Param('reference') reference: string) {
    return this.counsellingService.findBookingByRef(reference);
  }

  /** ───── Payment webhook / async confirmation ───── */

  // Simple endpoint to handle async payment confirmation
  // (could be called from a payment webhook controller as well)
  @Post('payment/confirm')
  @ApiExcludeEndpoint()
  async handlePaymentConfirmation(
    @Body()
    body: {
      reference: string;
      email: string;
    },
  ) {
    await this.counsellingService.handlePaymentConfirmation(
      body.reference,
      body.email,
    );
    return { message: 'Payment confirmation processed' };
  }
}
