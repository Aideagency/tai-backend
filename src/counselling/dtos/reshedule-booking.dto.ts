// dto/reschedule-booking.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class RescheduleBookingDto {
  @ApiProperty({
    description: 'New start time for the counselling session (ISO 8601 string)',
    example: '2025-02-15T14:00:00.000Z',
  })
  @IsDateString()
  newStartsAt: string;
}
