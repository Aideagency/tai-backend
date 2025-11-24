import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class BookCounsellingDto {
  @ApiProperty({
    description: 'ISO timestamp for when the session should start',
    example: '2025-04-21T14:30:00Z',
  })
  @IsString()
  @IsNotEmpty()
  startsAt: string;

  @ApiPropertyOptional({
    description: 'Notes or context provided by the client',
    example: 'I have been struggling with stress at work for the past month.',
  })
  @IsString()
  @IsOptional()
  clientNotes?: string;
}
