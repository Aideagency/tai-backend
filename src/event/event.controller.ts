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
import { EventService } from './event.service';
import { EventRegistrationEntity } from 'src/database/entities/event-registration.entity';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiExcludeEndpoint,
  ApiResponse,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateEventDto } from './dtos/create-event.dto';
import { GetEventsFilterDto } from './dtos/get-events-query.dto';
import { UpdateEventDto } from './dtos/update-event.dto';
import { EventEntity } from 'src/database/entities/event.entity';
import { JwtGuards } from 'src/auth/jwt.guards';

@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post('create')
  @UseInterceptors(FileInterceptor('coverImageUrl')) // Handle file upload
  @ApiConsumes('multipart/form-data') // Swagger knows we are consuming FormData
  @ApiBody({
    description: 'Create an event with a file upload',
    type: EventEntity, // Refers to the DTO we defined
  })
  @ApiResponse({ status: 201, description: 'Event created successfully.' })
  @ApiExcludeEndpoint()
  async createEvent(
    @Body() createEventDto: CreateEventDto, // Handle other form fields
    @UploadedFile() coverImageUrl: Express.Multer.File, // Handle file upload
  ) {
    if (coverImageUrl) {
      // If a file is uploaded, set the file path/URL for the cover image
      createEventDto.coverImageUrl = coverImageUrl.path; // Assuming Multer is storing the file
    }

    const event = await this.eventService.createEvent(createEventDto);
    return event;
  }

  @Put('update/:id')
  @UseInterceptors(FileInterceptor('coverImageUrl')) // Handle file upload
  @ApiConsumes('multipart/form-data') // Swagger knows we are consuming FormData
  @ApiBody({
    description: 'Update an event with a file upload',
    type: EventEntity, // Refers to the DTO we defined
  })
  @ApiResponse({ status: 200, description: 'Event updated successfully.' })
  @ApiExcludeEndpoint()
  async updateEvent(
    @Param('id') id: number,
    @Body() eventData: UpdateEventDto,
    @UploadedFile() coverImageUrl: Express.Multer.File,
  ) {
    if (coverImageUrl) {
      // If a file is uploaded, set the file path/URL for the cover image
      eventData.coverImageUrl = coverImageUrl.path; // Assuming Multer is storing the file
    }
    return await this.eventService.updateEvent(id, eventData);
  }

  @Delete('delete/:id')
  @ApiExcludeEndpoint()
  async deleteEvent(@Param('id') id: number) {
    return await this.eventService.deleteEvent(id);
  }

  @Get('detailed-event/:eventId')
  @ApiExcludeEndpoint()
  async fetchEventDetails(@Param('eventId') eventId: number) {
    return await this.eventService.getDetailedEventById(eventId);
  }

  @UseGuards(JwtGuards)
  @Get('all')
  @ApiBearerAuth()
  async fetchEvents(@Query() query: GetEventsFilterDto) {
    return this.eventService.getAllEvents(query);
  }

  @UseGuards(JwtGuards)
  @Get('event/:eventId')
  @ApiBearerAuth()
  async fetchEvent(@Param('eventId') eventId: number) {
    return await this.eventService.getEventById(eventId);
  }

  @UseGuards(JwtGuards)
  @Post('register/:eventId')
  @ApiBearerAuth()
  async registerForEvent(@Param('eventId') eventId: number, @Req() req: any) {
    return this.eventService.registerForEvent(req, eventId);
  }

  @Get('find/:reference')
  // @ApiBearerAuth()
  async findByReference(@Param('reference') reference: string) {
    return this.eventService.findRegByRef(reference);
  }

  // @UseGuards(JwtGuards)
  // @Put('update-registration/:registrationId')
  // @ApiBearerAuth()
  // async updateRegistration(
  //   @Param('registrationId') registrationId: number,
  //   @Body() updateData: any,
  // ) {
  //   return await this.eventService.updateRegistration(
  //     registrationId,
  //     updateData,
  //   );
  // }

  // @UseGuards(JwtGuards)
  // @Post('confirm-payment/:registrationId/:transactionId')
  // @ApiBearerAuth()
  // async confirmPayment(
  //   @Param('registrationId') registrationId: number,
  //   @Param('transactionId') transactionId: number,
  // ) {
  //   return await this.eventService.confirmPayment(
  //     registrationId,
  //     transactionId,
  //   );
  // }

  @UseGuards(JwtGuards)
  @Post('cancel-registration/:registrationId')
  @ApiBearerAuth()
  async cancelRegistration(
    @Param('registrationId') registrationId: number,
    @Req() req: any,
  ) {
    return await this.eventService.cancelRegistration(
      registrationId,
      req.user.id,
    );
  }
}
