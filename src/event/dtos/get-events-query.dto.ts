import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsBoolean, IsOptional } from 'class-validator';
import { EventType } from 'src/database/entities/event.entity';

export class GetEventsFilterDto {
  @ApiPropertyOptional({
    description: 'Filter events by type (e.g., COMMUNITY, CONFERENCE)',
    enum: EventType,
    example: EventType.CONFERENCE,
  })
  @IsEnum(EventType)
  @IsOptional()
  type?: EventType;

  @ApiPropertyOptional({
    description: 'Filter for upcoming events only (true/false)',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true') // Converts 'true' or 'false' string to boolean
  upcomingOnly?: boolean;

  @ApiPropertyOptional({
    description: 'Filter for free events (true/false)',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true') // Converts 'true' or 'false' string to boolean
  freeOnly?: boolean;

  @ApiPropertyOptional({
    description: 'Filter for paid events (true/false)',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true') // Converts 'true' or 'false' string to boolean
  paidOnly?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by keyword (e.g., title, description, location)',
    example: 'conference',
  })
  @IsOptional()
  q?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
  })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({
    description: 'Page size for pagination',
    example: 20,
  })
  @IsOptional()
  pageSize?: number;
}
