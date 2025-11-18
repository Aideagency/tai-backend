import {
  Controller,
  Post,
  Param,
  Body,
  Get,
  Put,
  Delete,
  Query,
} from '@nestjs/common';
import { EventService } from './event.service';
import { EventEntity } from 'src/database/entities/event.entity';
import { CreateEventDto } from './dtos/create-event.dto';
import { UpdateEventDto } from './dtos/update-event.dto';
import { RegisterUserForEventDto } from './dtos/register-user-for-event.dto';
import { RequestRefundDto } from './dtos/request-refund.dto';
import { GetEventsFilterDto } from './dtos/get-events-query.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('events')
@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  // Create event
  @Post()
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({
    status: 201,
    description: 'Event created successfully.',
  })
  async createEvent(@Body() createEventDto: CreateEventDto) {
    const event = await this.eventService.createEvent(createEventDto);
    return {
      status: 'success',
      message: 'Event created successfully',
      data: event,
    };
  }

  // Update event
  @Put(':id')
  @ApiOperation({ summary: 'Update an existing event' })
  @ApiResponse({
    status: 200,
    description: 'Event updated successfully.',
  })
  async updateEvent(
    @Param('id') id: number,
    @Body() updateEventDto: UpdateEventDto,
  ) {
    const updatedEvent = await this.eventService.updateEvent(
      id,
      updateEventDto,
    );
    return {
      status: 'success',
      message: 'Event updated successfully',
      data: updatedEvent,
    };
  }

  // Delete event
  @Delete(':id')
  @ApiOperation({ summary: 'Delete an event by ID' })
  @ApiResponse({
    status: 204,
    description: 'Event deleted successfully.',
  })
  async deleteEvent(@Param('id') id: number) {
    await this.eventService.deleteEvent(id);
    return {
      status: 'success',
      message: 'Event deleted successfully',
      data: null,
    };
  }

  // Register user for event
  @Post(':eventId/register')
  @ApiOperation({ summary: 'Register a user for an event' })
  @ApiResponse({
    status: 200,
    description: 'User successfully registered for the event.',
  })
  async registerUserForEvent(
    @Param('eventId') eventId: number,
    @Body() registerUserForEventDto: RegisterUserForEventDto,
  ) {
    const { userId, ticketTypeId, quantity, status } = registerUserForEventDto;
    const registrationResult = await this.eventService.registerUserForEvent(
      userId,
      eventId,
      ticketTypeId ?? null,
      quantity,
      status,
    );
    return {
      status: 'success',
      message: 'User successfully registered for the event',
      data: registrationResult,
    };
  }

  // Request refund
  @Post(':eventId/refund')
  @ApiOperation({ summary: 'Request a refund for an event registration' })
  @ApiResponse({
    status: 200,
    description: 'Refund request successfully created.',
  })
  async requestRefundForEvent(
    @Param('eventId') eventId: number,
    @Body() requestRefundDto: RequestRefundDto,
  ) {
    const { registrationId, amount, reason } = requestRefundDto;
    const refundRequest = await this.eventService.requestRefundForRegistration(
      registrationId,
      amount,
      reason ?? null,
    );
    return {
      status: 'success',
      message: 'Refund request created successfully',
      data: refundRequest,
    };
  }

  // Issue tickets for registration
  @Post(':eventId/tickets/issue')
  @ApiOperation({ summary: 'Issue tickets for a specific event registration' })
  @ApiResponse({
    status: 200,
    description: 'Tickets successfully issued for registration.',
  })
  async issueTicketsForEvent(
    @Param('eventId') eventId: number,
    @Body()
    { registrationId, codes }: { registrationId: number; codes: string[] },
  ) {
    const tickets = await this.eventService.issueTicketsForRegistration(
      registrationId,
      codes,
    );
    return {
      status: 'success',
      message: 'Tickets issued successfully',
      data: tickets,
    };
  }

  // Mark ticket as used
  @Post(':eventId/tickets/:ticketId/use')
  @ApiOperation({ summary: 'Mark a ticket as used for entry' })
  @ApiResponse({
    status: 200,
    description: 'Ticket marked as used successfully.',
  })
  async markTicketUsed(@Param('ticketId') ticketId: number) {
    const ticket = await this.eventService.markTicketUsed(ticketId);
    return {
      status: 'success',
      message: 'Ticket marked as used',
      data: ticket,
    };
  }

  // Get paginated events with filters (event type, upcoming, etc.)
  @Get()
  @ApiOperation({ summary: 'Get a paginated list of events with filters' })
  @ApiResponse({
    status: 200,
    description: 'A paginated list of events based on filter criteria.',
  })
  async getPaginatedEvents(
    @Query() filter: GetEventsFilterDto, // Get the filter query params
  ) {
    const events = await this.eventService.getEvents(filter);
    return {
      status: 'success',
      message: 'Fetched events successfully',
      data: events,
    };
  }

  // Get detailed event information
  @Get(':id')
  @ApiOperation({ summary: 'Get detailed information about a specific event' })
  @ApiResponse({
    status: 200,
    description: 'Detailed information about the event.',
  })
  async getEventInformation(@Param('id') id: number) {
    const event = await this.eventService.getEventInformation(id);
    return {
      status: 'success',
      message: 'Fetched event details successfully',
      data: event,
    };
  }
}
