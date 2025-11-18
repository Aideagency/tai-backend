import { Injectable, NotFoundException } from '@nestjs/common';
import { EventRepository } from 'src/repository/event/event.repository';
import { EventRegistrationRepository } from 'src/repository/event/event-registration.repository';
import { EventTicketRepository } from 'src/repository/event/event-ticket.repository';
import { EventEntity, RefundStatus } from 'src/database/entities/event.entity';
import { EventRegistrationEntity } from 'src/database/entities/event-registration.entity';
import { EventTicketEntity } from 'src/database/entities/event-ticket.entity';
import { RefundRequestEntity } from 'src/database/entities/refund-request.entity';
import {
  RegistrationStatus,
  TicketStatus,
} from 'src/database/entities/event.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateEventDto } from './dtos/create-event.dto';
import { RefundRequestRepository } from 'src/repository/event/refund-request.repository';

@Injectable()
export class EventService {
  constructor(
    private readonly eventRepo: EventRepository,
    private readonly registrationRepo: EventRegistrationRepository,
    private readonly ticketRepo: EventTicketRepository,
    private readonly refundRepo: RefundRequestRepository,
  ) {}

  // Create new event
  async createEvent(eventData: CreateEventDto): Promise<EventEntity> {
    const event = new EventEntity();

    // Setting the required fields from the CreateEventDto
    event.title = eventData.title;
    event.description = eventData.description;
    event.locationText = eventData.locationText;
    event.capacity = eventData.capacity || null; // Optional field, use null if not provided
    event.startsAt = eventData.startsAt;
    event.endsAt = eventData.endsAt;

    // Setting optional fields with defaults if not provided in the DTO
    // event.locationUrl = eventData.locationUrl || 'default-location-url'; // Default location URL
    // event.icsToken = eventData.icsToken || 'default-ics-token'; // Default ICS token
    // event.organizer = eventData.organizer || 'Default Organizer'; // Default organizer name
    // event.ticketTypes = eventData.ticketTypes || []; // Default empty array for ticket types

    // If you have any other required or optional fields, map them here similarly.

    return this.eventRepo.save(event); // Save and return the newly created event
  }

  // Update event details
  async updateEvent(
    id: number,
    updateData: Partial<EventEntity>,
  ): Promise<EventEntity> {
    const event = await this.eventRepo.findOne({ id });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    return this.eventRepo.save({ ...event, ...updateData });
  }

  // Delete event
  async deleteEvent(id: number): Promise<void> {
    const event = await this.eventRepo.findOne({ id });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    await this.eventRepo.remove(event);
  }

  // Register user for event
  async registerUserForEvent(
    userId: number,
    eventId: number,
    ticketTypeId: number | null,
    quantity: number,
    status: RegistrationStatus,
  ): Promise<EventRegistrationEntity> {
    const event = this.eventRepo.findOne({
      where: {
        id: eventId,
      },
    });
    const registration = await this.registrationRepo.createRegistration({
      userId,
      eventId,
      ticketTypeId,
      quantity,
      status,
      unitPrice: '100.00', // Example price, replace with actual calculation
      totalAmount: quantity.toString(), // Example amount
    });
    return registration;
  }

  // Issue tickets for a registration
  async issueTicketsForRegistration(
    registrationId: number,
    codes: string[],
  ): Promise<EventTicketEntity[]> {
    return await this.ticketRepo.issueForRegistration({
      registrationId,
      codes,
    });
  }

  // Request refund for registration
  //   async requestRefundForRegistration(
  //     registrationId: number,
  //     amount: string,
  //     reason: string | null,
  //   ): Promise<RefundRequestEntity> {
  //     return this.refundRepo.createRefundRequest({
  //       registrationId,
  //       amount,
  //       reason,
  //     });
  //   }

  async requestRefundForRegistration(
    registrationId: number,
    amount: string,
    reason: string | null,
  ): Promise<RefundRequestEntity> {
    return this.refundRepo.createRefundRequest({
      registrationId,
      reason,
      amount,
    });
  }

  async approveRefund(refundId: number): Promise<RefundRequestEntity> {
    return this.refundRepo.approveRefund(refundId);
  }

  // Mark ticket as used
  async markTicketUsed(ticketId: number): Promise<EventTicketEntity> {
    return this.ticketRepo.markUsed(ticketId);
  }

  async getEventInformation(eventId: number) {
    return this.eventRepo.findByIdWithDetails(eventId);
  }

  async getEvents(params) {
    return this.eventRepo.getPaginatedEvents(params);
  }
}
