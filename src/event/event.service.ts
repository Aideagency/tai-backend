import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { EventRepository } from 'src/repository/event/event.repository';
import { EventRegistrationRepository } from 'src/repository/event/event-registration.repository';
import { EventEntity, EventStatus } from 'src/database/entities/event.entity';
import {
  EventRegistrationEntity,
  RegistrationStatus,
} from 'src/database/entities/event-registration.entity';
import { GetEventsFilterDto } from './dtos/get-events-query.dto';
import { PaymentService } from 'src/payment/payment.service';
import {
  PaidFor,
  TransactionEntity,
} from 'src/database/entities/transaction.entity';
import { TransactionRepository } from 'src/repository/transaction/transaction.repository';
import { EmailService } from 'src/infrastructure/communication/email/email.service';
import { TracerLogger } from 'src/logger/logger.service';

// import { RegistrationStatus } from 'src/database/entities/event.entity';

@Injectable()
export class EventService {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly eventRegistrationRepository: EventRegistrationRepository,
    @Inject(forwardRef(() => PaymentService))
    private readonly paymentService: PaymentService,
    private readonly transactionRepo: TransactionRepository,
    private readonly emailService: EmailService,
    private readonly logger: TracerLogger,
  ) {}

  // Create an Event
  async createEvent(eventData: Partial<EventEntity>): Promise<EventEntity> {
    const event = await this.eventRepository.createEvent(eventData);
    return event;
  }

  // Update an Event
  async updateEvent(
    id: number,
    eventData: Partial<EventEntity>,
  ): Promise<EventEntity> {
    const event = await this.eventRepository.updateEvent(id, eventData);
    return event;
  }

  // Register for an Event
  async registerForEvent(userId: number, email: string, eventId: number) {
    const isRegistered =
      await this.eventRegistrationRepository.findUserRegistration(
        userId,
        eventId,
      );

    if (isRegistered && isRegistered.status === RegistrationStatus.CONFIRMED) {
      throw new BadRequestException(
        'You can only register once for this event',
      );
    }
    const event = await this.eventRepository.findEventById(eventId);

    // Prevent registration if the event has already ended
    if (event.endsAt < new Date()) {
      throw new BadRequestException(
        'Event has already ended, registration is closed',
      );
    }

    if (Number(event.price) > 0) {
      const transaction = new TransactionEntity();
      const paymentResponse = await this.paymentService.initializePayment({
        email,
        amount: String(event.price * 100),
      });
      console.log(paymentResponse);

      transaction.transaction_ref = paymentResponse.reference;
      transaction.email_address = email;
      transaction.paid_for = PaidFor.EVENT;
      transaction.actualAmount = event.price;
      await this.transactionRepo.save(transaction);
      await this.eventRegistrationRepository.createRegistration({
        userId,
        eventId,
        status: RegistrationStatus.PENDING_PAYMENT,
        unitPrice: String(event.price),
      });

      // Return the checkout url
      return {
        authorization_url: paymentResponse.authorization_url,
        reference: paymentResponse.reference,
      };
    } else {
      // Register the user for the event directly
      const registration =
        await this.eventRegistrationRepository.createRegistration({
          userId,
          eventId,
          status: event.price
            ? RegistrationStatus.PENDING_PAYMENT
            : RegistrationStatus.CONFIRMED, // Initially set to pending payment
          unitPrice: null,
        });
      return registration;
    }
  }

  // Update Registration Information
  async updateRegistration(
    registrationId: number,
    updateData: Partial<EventRegistrationEntity>,
  ): Promise<EventRegistrationEntity> {
    const registration = await this.eventRegistrationRepository.findOne({
      id: registrationId,
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    // Update registration information
    Object.assign(registration, updateData);
    await this.eventRegistrationRepository.save(registration);
    return registration;
  }

  // Confirm Payment for a Registration
  async confirmPayment(
    registrationId: number,
    transactionId: number,
  ): Promise<EventRegistrationEntity> {
    // Confirm the payment for the given registration
    const registration = await this.eventRegistrationRepository.confirmPayment(
      registrationId,
      transactionId,
    );
    return registration;
  }

  // Cancel a Registration
  async cancelRegistration(
    registrationId: number,
    userId: number,
  ): Promise<boolean> {
    // Cancel the registration
    const cancelled = await this.eventRegistrationRepository.cancel(
      registrationId,
      userId,
    );
    return cancelled;
  }

  // Additional Helper Methods

  // Get all registrations for an event
  async getEventRegistrations(eventId: number) {
    const registrations = await this.eventRegistrationRepository.findAll({
      event: { id: eventId },
    });
    return registrations;
  }

  // Get all events
  async getAllEvents(params: GetEventsFilterDto) {
    const events = await this.eventRepository.searchEventsPaginated(params);

    return events;
  }

  // Get a single event by ID
  async getEventById(id: number) {
    const event = await this.eventRepository.findEventById(id);
    return event;
  }

  async getDetailedEventById(id: number) {
    const event = await this.eventRepository.findDetailedEventById(id);
    return event;
  }

  async deleteEvent(id: number) {
    return this.eventRepository.deleteEvent(id);
  }

  // Check if a user is already registered for an event
  async isUserRegisteredForEvent(userId: number, eventId: number) {
    const registration =
      await this.eventRegistrationRepository.findUserRegistration(
        userId,
        eventId,
      );
    return registration !== null;
  }

  async handlePaymentConfirmation(ref: string, email: string) {
    const registration =
      await this.eventRegistrationRepository.findRegistrationByTransactionRef(
        ref,
      );
    if (registration) {
      registration.status = RegistrationStatus.CONFIRMED;
      await this.eventRegistrationRepository.save(registration);

      console.log(registration);

      this.emailService
        .sendMail({
          to: email,
          subject: 'Account Verification',
          template: 'account-verification',
          data: {
            username: registration.user.first_name,
            event_title: registration.event.title,
            event_mode: registration.event.mode,
            event_location:
              registration.event.locationText || registration.event.locationUrl,
            price: registration.event.price,
            start_date: registration.event.startsAt,
            end_date: registration.event.endsAt,
          },
        })
        .then((res) => {
          this.logger.log(res);
        })
        .catch((err) => this.logger.error(err));
    }
    return registration !== null;
  }
}
