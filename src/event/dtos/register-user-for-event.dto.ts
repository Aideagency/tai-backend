import { IsInt, IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger'; // Import ApiProperty from @nestjs/swagger
import { RegistrationStatus } from 'src/database/entities/event.entity';

export class RegisterUserForEventDto {
  @ApiProperty({
    description: 'The ID of the user registering for the event',
    example: 123, // Example user ID
  })
  @IsInt()
  userId: number;

  @ApiProperty({
    description:
      'The ID of the ticket type being selected for the event (optional)',
    example: 1, // Example ticket type ID
    required: false, // This field is optional
  })
  @IsInt()
  @IsOptional()
  ticketTypeId: number | null;

  @ApiProperty({
    description: 'The number of tickets being registered for the event',
    example: 2, // Example quantity
  })
  @IsInt()
  quantity: number;

  @ApiProperty({
    description: 'The current registration status of the user for the event',
    enum: RegistrationStatus,
    example: RegistrationStatus.PENDING_PAYMENT, // Example status
  })
  @IsEnum(RegistrationStatus)
  status: RegistrationStatus;

  @ApiProperty({
    description: 'The unit price of each ticket',
    example: '150.00', // Example unit price
  })
  @IsString()
  unitPrice: string;
}
