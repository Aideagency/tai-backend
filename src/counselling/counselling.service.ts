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
import { GetCounsellingBookingsFilterDto } from './dtos/get-counselling-booking-filter.dto';
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

  async getCounsellingBookingsPaginated(
    counsellingId: number,
    filters: GetCounsellingBookingsFilterDto,
  ) {
    const {
      q,
      status,
      from,
      to,
      userId,
      counsellorId,
      page = 1,
      pageSize = 20,
      orderBy = 'createdAt',
      orderDir = 'DESC',
    } = filters;

    const qb = this.counsellingBookingRepository
      .query('booking')
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('booking.counselling', 'counselling')
      .leftJoinAndSelect('booking.counsellor', 'counsellor')
      .where('counselling.id = :counsellingId', { counsellingId });

    // 🔍 Apply search filtering
    if (q && q.trim() !== '') {
      qb.andWhere(
        `(user.fullName ILIKE :q OR user.email ILIKE :q OR booking.notes ILIKE :q)`,
        { q: `%${q}%` },
      );
    }

    // 🔵 Status filter
    if (status) {
      qb.andWhere('booking.status = :status', { status });
    }

    // 📅 Date range
    if (from) {
      qb.andWhere('booking.createdAt >= :from', { from });
    }
    if (to) {
      qb.andWhere('booking.createdAt <= :to', { to });
    }

    // 👤 User filter
    if (userId) {
      qb.andWhere('user.id = :userId', { userId });
    }

    // 🧑‍⚕️ Counsellor admin filter
    if (counsellorId) {
      qb.andWhere('counsellor.id = :counsellorId', { counsellorId });
    }

    // 🔽 Sorting
    qb.orderBy(`booking.${orderBy}`, orderDir);

    // 📄 Pagination (reuse BaseRepository.paginate)
    return this.counsellingBookingRepository.paginate(
      { page, limit: pageSize },
      {}, // Not used with query builder
      {},
      {},
      qb,
    );
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

    await this.emailService
      .sendMail({
        to: booking.user?.email_address,
        subject: 'Counselling Booking Confirmed',
        template: 'counselling-booking',
        data: {
          // USER DETAILS
          username: booking.user?.first_name,
          user_email: booking.user?.email_address,

          // COUNSELLING DETAILS
          counselling_title: booking.counselling?.title,
          counselling_mode: booking.counselling?.mode,
          counselling_type: booking.counselling?.type,

          // BOOKING-SPECIFIC SNAPSHOTS
          booking_reference: booking.reference,
          booking_status: booking.status,
          duration_minutes: booking.durationMinutes,
          price: booking.priceAtBooking,

          // DATETIME FIELDS
          start_date: booking.startsAt,
          end_date: booking.endsAt,
          paid_at: booking.paidAt,

          // LOCATION / MEETING DETAILS
          location_text: booking.locationText || null,

          meeting_link: booking.meetingLink || null,

          // COUNSELLOR
          counsellor_name:
            `${booking.counsellor?.first_name || ''} ${
              booking.counsellor?.last_name || ''
            }`.trim() || null,

          // ATTENDANCE & PAYMENT
          attended: booking.attended,
          transaction_ref: booking.transaction_ref,

          // NOTES
          client_notes: booking.clientNotes || null,
          counsellor_notes: booking.counsellorNotes || null,
        },
      })
      .then((res) => this.logger.log(res))
      .catch((err) => this.logger.error(err));

    return booking;
  }

  async getBooking(bookingId: number) {
    return this.counsellingBookingRepository.findOne({ id: bookingId });
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
          // USER DETAILS
          username: booking.user?.first_name,
          user_email: booking.user?.email_address,

          // COUNSELLING DETAILS
          counselling_title: booking.counselling?.title,
          counselling_mode: booking.counselling?.mode,
          counselling_type: booking.counselling?.type,

          // BOOKING-SPECIFIC SNAPSHOTS
          booking_reference: booking.reference,
          booking_status: booking.status,
          duration_minutes: booking.durationMinutes,
          price: booking.priceAtBooking,

          // DATETIME FIELDS
          start_date: booking.startsAt,
          end_date: booking.endsAt,
          paid_at: booking.paidAt,

          // LOCATION / MEETING DETAILS
          location_text: booking.locationText || null,

          meeting_link: booking.meetingLink || null,

          // COUNSELLOR
          counsellor_name:
            `${booking.counsellor?.first_name || ''} ${
              booking.counsellor?.last_name || ''
            }`.trim() || null,

          // ATTENDANCE & PAYMENT
          attended: booking.attended,
          transaction_ref: booking.transaction_ref,

          // NOTES
          client_notes: booking.clientNotes || null,
          counsellor_notes: booking.counsellorNotes || null,
        },
      })
      .then((res) => this.logger.log(res))
      .catch((err) => this.logger.error(err));
  }
}
