import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { EventRepository } from 'src/repository/event/event.repository';
import { EventRegistrationRepository } from 'src/repository/event/event-registration.repository';
import { EventEntity, EventStatus } from 'src/database/entities/event.entity';
import {
  EventRegistrationEntity,
  RegistrationStatus,
} from 'src/database/entities/event-registration.entity';
import { GetEventsFilterDto } from './dtos/get-events-query.dto';
// import { RegistrationStatus } from 'src/database/entities/event.entity';

@Injectable()
export class EventService {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly eventRegistrationRepository: EventRegistrationRepository,
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
  async registerForEvent(
    userId: number,
    eventId: number,
  ): Promise<EventRegistrationEntity> {
    const event = await this.eventRepository.findEventById(eventId);

    // Prevent registration if the event has already ended
    if (event.endsAt < new Date()) {
      throw new BadRequestException(
        'Event has already ended, registration is closed',
      );
    }

    // Register the user for the event
    const registration =
      await this.eventRegistrationRepository.createRegistration({
        userId,
        eventId,
        status: RegistrationStatus.PENDING_PAYMENT, // Initially set to pending payment
        unitPrice: event.price ? String(event.price) : null,
      });

    return registration;
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
}
