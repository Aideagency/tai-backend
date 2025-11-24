import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';

import {
  CounsellingEntity,
  CounsellingMode,
} from 'src/database/entities/counselling.entity';
import {
  CounsellingBookingEntity,
  CounsellingBookingStatus,
} from 'src/database/entities/counselling-booking.entity';
import { PaymentService } from 'src/payment/payment.service';
import {
  PaidFor,
  TransactionEntity,
} from 'src/database/entities/transaction.entity';
import { TransactionRepository } from 'src/repository/transaction/transaction.repository';
import { EmailService } from 'src/infrastructure/communication/email/email.service';
import { TracerLogger } from 'src/logger/logger.service';
import { CounsellingBookingRepository } from 'src/repository/counselling/counselling-booking.repostiory';
import { CounsellingRepository } from 'src/repository/counselling/counselling.repostiory';
// import { GetCounsellingsFilterDto } from './dtos/get-counselling-query.dto';

@Injectable()
export class CounsellingService {
  constructor(
    private readonly counsellingRepository: CounsellingRepository,
    private readonly counsellingBookingRepository: CounsellingBookingRepository,
    @Inject(forwardRef(() => PaymentService))
    private readonly paymentService: PaymentService,
    private readonly transactionRepo: TransactionRepository,
    private readonly emailService: EmailService,
    private readonly logger: TracerLogger,
  ) {}

  /** ---------- Counselling CRUD ---------- */

  // Create a counselling offer
  async createCounselling(
    data: Partial<CounsellingEntity>,
  ): Promise<CounsellingEntity> {
    return this.counsellingRepository.createCounselling(data);
  }

  // Update a counselling offer
  async updateCounselling(
    id: number,
    data: Partial<CounsellingEntity>,
  ): Promise<CounsellingEntity> {
    // If you want to block *all* updates when bookings exist, uncomment:
    // const bookings = await this.counsellingBookingRepository.findAll({
    //   counselling: { id },
    // });
    // if (bookings.length > 0) {
    //   throw new BadRequestException(
    //     'Counselling offer cannot be updated because bookings exist',
    //   );
    // }

    // Otherwise let the repository enforce only the "no price update after bookings" rule
    return this.counsellingRepository.updateCounselling(id, data);
  }

  async deleteCounselling(id: number) {
    return this.counsellingRepository.deleteCounselling(id);
  }

  // Get all counselling offers (paginated + filtered)
  async getAllCounsellings(
    params: any, // replace `any` with GetCounsellingsFilterDto when you create it
  ) {
    return this.counsellingRepository.searchCounsellingsPaginated(params);
  }

  // Get a single counselling offer
  async getCounsellingById(id: number) {
    return this.counsellingRepository.findCounsellingById(id);
  }

  async getDetailedCounsellingById(id: number) {
    return this.counsellingRepository.findDetailedCounsellingById(id);
  }

  /** ---------- Booking / Payment Flow ---------- */

  /**
   * Book a counselling session.
   * `body` should contain at least:
   * - startsAt (Date string)
   * - clientNotes? (string)
   */
  async bookCounselling(
    req: any,
    counsellingId: number,
    body: { startsAt: string; clientNotes?: string },
  ) {
    const userId = req.user.id;
    const userEmail = req.user.email;
    const userFirstName = req.user.first_name;

    const counselling =
      await this.counsellingRepository.findCounsellingById(counsellingId);

    if (!counselling.isActive) {
      throw new BadRequestException('This counselling offer is not active');
    }

    const startsAt = new Date(body.startsAt);
    if (isNaN(startsAt.getTime())) {
      throw new BadRequestException('Invalid start date/time');
    }

    // Prevent booking in the past
    const now = new Date();
    if (startsAt < now) {
      throw new BadRequestException(
        'You cannot book a session in the past time',
      );
    }

    // Compute endsAt from duration
    const durationMinutes = counselling.durationMinutes;
    const endsAt = new Date(startsAt.getTime() + durationMinutes * 60_000);

    // Paid vs free
    const price = Number(counselling.price || 0);

    if (price > 0) {
      // Paid counselling – initialize payment
      const transaction = new TransactionEntity();
      const paymentResponse = await this.paymentService.initializePayment({
        email: userEmail,
        amount: String(price * 100), // kobo
      });

      transaction.transaction_ref = paymentResponse.reference;
      transaction.email_address = userEmail;
      transaction.paid_for = PaidFor.COUNSELLING; // make sure this exists in your enum
      transaction.actualAmount = price;
      await this.transactionRepo.save(transaction);

      await this.counsellingBookingRepository.createBooking({
        userId,
        counsellingId,
        status: CounsellingBookingStatus.PENDING_PAYMENT,
        priceAtBooking: price,
        durationMinutes,
        startsAt,
        endsAt,
        reference: paymentResponse.reference,
        clientNotes: body.clientNotes ?? null,
      });

      return {
        message: 'Payment initiated',
        data: {
          authorization_url: paymentResponse.authorization_url,
          reference: paymentResponse.reference,
        },
      };
    } else {
      // Free counselling – confirm booking directly
      const booking = await this.counsellingBookingRepository.createBooking({
        userId,
        counsellingId,
        status: CounsellingBookingStatus.CONFIRMED,
        priceAtBooking: 0,
        durationMinutes,
        startsAt,
        endsAt,
        reference: null,
        clientNotes: body.clientNotes ?? null,
      });

      await this.emailService.sendMail({
        to: userEmail,
        subject: 'Counselling Booking Confirmed',
        template: 'counselling-booking', // create this template
        data: {
          username: userFirstName,
          counselling_title: counselling.title,
          counselling_mode: counselling.mode,
          starts_at: startsAt,
          ends_at: endsAt,
          price: price,
        },
      });

      return {
        message: 'Booking successful',
        data: booking,
      };
    }
  }

  // Update booking information (admin or counsellor)
  async updateBooking(
    bookingId: number,
    updateData: Partial<CounsellingBookingEntity>,
  ): Promise<CounsellingBookingEntity> {
    const booking = await this.counsellingBookingRepository.findOne({
      id: bookingId,
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    Object.assign(booking, updateData);
    await this.counsellingBookingRepository.save(booking);
    return booking;
  }

  // Confirm payment for a booking (using internal id + transaction ref)
  async confirmPayment(
    bookingId: number,
    transactionRef: string,
  ): Promise<CounsellingBookingEntity> {
    const booking = await this.counsellingBookingRepository.confirmPayment(
      bookingId,
      transactionRef,
    );
    return booking;
  }

  // Cancel booking (by user)
  async cancelBooking(bookingId: number, userId: number): Promise<boolean> {
    return this.counsellingBookingRepository.cancel(bookingId, userId);
  }

  // Get all bookings for a counselling offer
  async getCounsellingBookings(counsellingId: number) {
    return this.counsellingBookingRepository.findAll({
      counselling: { id: counsellingId },
    });
  }

  // Check if a user has already booked this counselling (any status)
  async isUserBookedForCounselling(userId: number, counsellingId: number) {
    const booking = await this.counsellingBookingRepository.findUserBooking(
      userId,
      counsellingId,
    );
    return booking !== null && booking !== undefined;
  }

  // Find booking by transaction reference and send confirmation email
  async findBookingByRef(ref: string) {
    const booking =
      await this.counsellingBookingRepository.findBookingByTransactionRef(ref);

    const counselling = booking.counselling;
    const user = booking.user;

    await this.emailService.sendMail({
      to: user.email_address,
      subject: 'Counselling Booking Confirmed',
      template: 'counselling-booking',
      data: {
        username: user.first_name,
        counselling_title: counselling.title,
        counselling_mode: counselling.mode,
        starts_at: booking.startsAt,
        ends_at: booking.endsAt,
        price: booking.priceAtBooking,
      },
    });

    return booking;
  }

  /**
   * Handle webhook/async payment confirmation by transaction reference.
   * (Paystack / Flutterwave callback etc.)
   */
  async handlePaymentConfirmation(ref: string, email: string) {
    const booking =
      await this.counsellingBookingRepository.findBookingByTransactionRef(ref);

    if (!booking) return;

    booking.status = CounsellingBookingStatus.CONFIRMED;
    booking.paidAt = new Date();
    await this.counsellingBookingRepository.save(booking);

    this.emailService
      .sendMail({
        to: email,
        subject: 'Counselling Booking Confirmed',
        template: 'counselling-booking',
        data: {
          username: booking.user.first_name,
          counselling_title: booking.counselling.title,
          counselling_mode: booking.counselling.mode,
          starts_at: booking.startsAt,
          ends_at: booking.endsAt,
          price: booking.priceAtBooking,
        },
      })
      .then((res) => this.logger.log(res))
      .catch((err) => this.logger.error(err));
  }
}
