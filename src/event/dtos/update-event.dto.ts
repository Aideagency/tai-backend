import { IsString, IsOptional, IsEnum, IsDate, IsInt } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  EventType,
  EventStatus,
  EventMode,
} from 'src/database/entities/event.entity';
import { Type } from 'class-transformer';

export class UpdateEventDto {
  @ApiPropertyOptional({
    description: 'The title of the event',
    example: 'Tech Conference 2023',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: 'A detailed description of the event',
    example:
      'A conference bringing together tech enthusiasts to discuss the latest innovations.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'The location text for the event',
    example: 'Eko Hotel, Lagos',
  })
  @IsOptional()
  @IsString()
  locationText?: string;

  @ApiPropertyOptional({
    description: 'The type of event',
    example: EventType.CONFERENCE,
    enum: EventType,
  })
  @IsOptional()
  @IsEnum(EventType)
  type?: EventType;

  @ApiPropertyOptional({
    description: 'The status of the event',
    example: EventStatus.PUBLISHED,
    enum: EventStatus,
  })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @ApiPropertyOptional({
    description: 'Maximum number of attendees',
    example: 500,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  capacity?: number;

  @ApiPropertyOptional({
    description: 'Start date of the event',
    example: '2023-12-01T10:00:00Z',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startsAt?: Date;

  @ApiPropertyOptional({
    description: 'End date of the event',
    example: '2023-12-01T18:00:00Z',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endsAt?: Date;

  @ApiPropertyOptional({
    description: 'Mode of the event',
    example: EventMode.ONLINE,
    enum: EventMode,
  })
  @IsOptional()
  @IsEnum(EventMode)
  mode?: EventMode;

  @ApiPropertyOptional({
    description: 'An uploaded image file for the event',
    type: 'string',
    format: 'binary',
  })
  @IsOptional()
  coverImageUrl?: string | null;

  @ApiPropertyOptional({
    description: 'URL for online events (Zoom, Meet, etc.)',
    example: 'https://zoom.us/j/123456789',
  })
  @IsOptional()
  @IsString()
  locationUrl?: string;

  @ApiPropertyOptional({
    description: 'The price for the event ticket if it is not free.',
    example: 500,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number) // Ensure the value is transformed into a number
  price: number;
}
