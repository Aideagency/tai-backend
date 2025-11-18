import {
  IsString,
  IsOptional,
  IsEnum,
  IsDate,
  IsInt,
  IsDecimal,
} from 'class-validator';
import { EventType, EventStatus } from 'src/database/entities/event.entity';

export class UpdateEventDto {
  @IsString()
  @IsOptional()
  title: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsString()
  @IsOptional()
  locationText: string;

  @IsEnum(EventType)
  @IsOptional()
  type: EventType;

  @IsEnum(EventStatus)
  @IsOptional()
  status: EventStatus;

  @IsInt()
  @IsOptional()
  capacity: number;

  @IsDate()
  @IsOptional()
  startsAt: Date;

  @IsDate()
  @IsOptional()
  endsAt: Date;

  @IsString()
  @IsOptional()
  imageUrl: string;
}
