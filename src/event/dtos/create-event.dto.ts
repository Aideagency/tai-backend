import { IsString, IsOptional, IsEnum, IsDate, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'; // Import Swagger decorators
import {
  EventType,
  EventStatus,
  EventMode,
} from 'src/database/entities/event.entity';
import { Type } from 'class-transformer';

export class CreateEventDto {
  @ApiProperty({
    description: 'The title of the event',
    example: 'Tech Conference 2023',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'A detailed description of the event',
    example:
      'A conference bringing together tech enthusiasts to discuss the latest innovations in AI, cloud computing, and blockchain.',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'The location of the event (physical or online)',
    example: 'Eko Hotel, Lagos, Nigeria',
  })
  @IsString()
  locationText: string;

  @ApiProperty({
    description:
      'The type of event, e.g., community event, conference, retreat',
    example: EventType.CONFERENCE,
    enum: EventType,
  })
  @IsEnum(EventType)
  type: EventType;

  @ApiProperty({
    description:
      'The current status of the event (e.g., draft, published, cancelled)',
    example: EventStatus.PUBLISHED,
    enum: EventStatus,
  })
  @IsEnum(EventStatus)
  status: EventStatus;

  @ApiPropertyOptional({
    description:
      'The maximum number of attendees for the event. Leave empty for no limit.',
    example: 500,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number) // Ensure the value is transformed into a number
  capacity: number;

  @ApiProperty({
    description: 'The start date and time of the event',
    example: '2023-12-01T10:00:00Z',
  })
  @IsDate()
  @Type(() => Date) // Ensure the value is transformed into a Date
  startsAt: Date;

  @ApiProperty({
    description: 'The end date and time of the event',
    example: '2023-12-01T18:00:00Z',
  })
  @IsDate()
  @Type(() => Date) // Ensure the value is transformed into a Date
  endsAt: Date;

  @ApiPropertyOptional({
    description: 'The mode of the event, either ONLINE or OFFLINE',
    example: EventMode.ONLINE,
    enum: EventMode,
  })
  @IsEnum(EventMode)
  @IsOptional()
  mode: EventMode;

  @ApiPropertyOptional({
    description: 'An image file for the event (e.g., promotional banner)',
    type: 'string',
    format: 'binary',
  })
  @IsOptional()
  coverImageUrl: string | null; // This will handle the file upload

  @ApiPropertyOptional({
    description: 'The URL for online events (e.g., Zoom link)',
    example: 'https://zoom.us/j/1234567890',
  })
  @IsOptional()
  @IsString()
  locationUrl: string;

  @ApiPropertyOptional({
    description:
      'The price for the event ticket if it is not free.',
    example: 500,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number) // Ensure the value is transformed into a number
  price: number;
}
