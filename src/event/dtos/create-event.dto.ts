import {
  IsString,
  IsOptional,
  IsEnum,
  IsDate,
  IsInt,
  IsDecimal,
} from 'class-validator';
import { EventType, EventStatus } from 'src/database/entities/event.entity';

export class CreateEventDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  locationText: string;

  @IsEnum(EventType)
  type: EventType;

  @IsEnum(EventStatus)
  status: EventStatus;

  @IsOptional()
  @IsInt()
  capacity: number;

  @IsDate()
  startsAt: Date;

  @IsDate()
  endsAt: Date;

  @IsOptional()
  @IsString()
  imageUrl: string;
}
