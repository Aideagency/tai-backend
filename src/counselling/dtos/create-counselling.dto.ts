import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsBoolean,
  Min,
} from 'class-validator';
import {
  CounsellingMode,
  CounsellingStatus,
  CounsellingType,
} from 'src/database/entities/counselling.entity';

export class CreateCounsellingDto {
  @ApiProperty({
    description: 'Title of the counselling session',
    example: 'Anxiety Management Session',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: 'Short overview of the counselling session',
    example: 'A guided 1-on-1 session to help you manage anxiety triggers.',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Duration of the counselling session in minutes',
    example: 45,
  })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  durationMinutes: number;

  @ApiProperty({
    enum: CounsellingMode,
    description: 'Whether the session is online or physical',
    example: CounsellingMode.ONLINE,
  })
  @IsEnum(CounsellingMode)
  mode: CounsellingMode;

  @ApiProperty({
    enum: CounsellingType,
    description: 'Type of counselling session',
    example: CounsellingType.INDIVIDUAL,
  })
  @IsEnum(CounsellingType)
  type: CounsellingType;

  @ApiPropertyOptional({
    description: 'Price of the counselling session (0 or null means free)',
    example: 15000,
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional({
    description:
      'An image file for the counselling time (e.g., counselling banner)',
    type: 'string',
    format: 'binary',
  })
  @IsOptional()
  coverUrl?: string;

  @ApiPropertyOptional({
    description: 'What the client receives from the session',
    example: 'Personalized anxiety coping strategies and worksheets.',
  })
  @IsString()
  @IsOptional()
  whatYouGet?: string;

  @ApiPropertyOptional({
    description: 'Target audience for the counselling session',
    example: 'Students, young adults, and working professionals.',
  })
  @IsString()
  @IsOptional()
  whoItsFor?: string;

  @ApiPropertyOptional({
    description: 'Session structure or workflow',
    example: 'Introduction → Exploration → Action Plan → Q&A',
  })
  @IsString()
  @IsOptional()
  howItWorks?: string;

  @ApiPropertyOptional({
    description: 'Internal notes by counsellor (not shown publicly)',
    example: 'Always ask about previous therapy experiences.',
  })
  @IsString()
  @IsOptional()
  counsellorNotes?: string;

  @ApiPropertyOptional({
    description:
      'Maximum allowed participants per session (for group counselling)',
    example: 5,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  maxClientsPerSession?: number;

  @ApiPropertyOptional({
    description: 'Whether this counselling offer is active',
    example: true,
  })
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Mark as featured to show on homepage or promotional areas',
    example: false,
  })
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;
}
