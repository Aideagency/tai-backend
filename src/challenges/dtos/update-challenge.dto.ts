// src/challenges/dtos/create-challenge.dto.ts
import {
  IsEnum,
  IsInt,
  Min,
  Max,
  IsArray,
  IsOptional,
  IsString,
  Length,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateChallengeTaskDto } from './create-challenge-task.dto';
import { CommunityTag as CommunityType } from 'src/database/entities/user.entity';
import {
  ChallengeFrequency,
  ChallengeStatus,
  Visibility,
} from 'src/database/entities/challenge.entity';
import { Transform, Type } from 'class-transformer';
import { sanitizeString } from 'src/nuggets/dtos/create-nugget.dto';

/** ---- helpers for multipart/form-data ---- */
function toNumber(v: any) {
  if (v === undefined || v === null || v === '') return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? v : n;
}

function toBoolean(v: any) {
  if (v === undefined || v === null || v === '') return undefined;
  if (typeof v === 'boolean') return v;

  const s = String(v).trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(s)) return true;
  if (['false', '0', 'no', 'off'].includes(s)) return false;

  return v;
}

function toJson(v: any) {
  if (v === undefined || v === null || v === '') return undefined;
  if (typeof v === 'object') return v;
  try {
    return JSON.parse(v);
  } catch {
    return v;
  }
}

export class UpdateChallengeDto {
  @ApiProperty({
    description:
      'The title of the challenge (e.g., "Self-Discovery Reading Challenge")',
    example: 'The Self-Discovery Reading Challenge',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(3, 100)
  @sanitizeString()
  title?: string;

  @ApiProperty({
    description:
      'The community this challenge is for (e.g., SINGLE, MARRIED, PARENT)',
    enum: CommunityType,
    enumName: 'CommunityType',
    example: CommunityType.SINGLE,
  })
  @IsOptional()
  @IsEnum(CommunityType)
  community?: CommunityType;

  @ApiProperty({
    description: 'The duration of the challenge in days (e.g., 7, 14, 42)',
    example: 42,
    minimum: 1,
    maximum: 365,
  })
  @IsOptional()
  @Transform(({ value }) => toNumber(value))
  @IsInt()
  @Min(1)
  @Max(365)
  durationDays?: number;

  @ApiProperty({
    description:
      'The frequency of tasks within the challenge. Options: DAILY, WEEKLY, MIXED',
    enum: ChallengeFrequency,
    enumName: 'ChallengeFrequency',
    example: ChallengeFrequency.DAILY,
  })
  @IsOptional()
  @IsEnum(ChallengeFrequency)
  frequency?: ChallengeFrequency;

  @ApiProperty({
    description: 'Visibility of the challenge. Options: PUBLIC, COMMUNITY_ONLY',
    enum: Visibility,
    example: Visibility.COMMUNITY_ONLY,
  })
  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Cover image upload (jpg/png/webp).',
  })
  coverUrl?: Express.Multer.File;

  @ApiPropertyOptional({
    description:
      'Optional detailed description of the challenge. This explains the purpose and structure of the challenge.',
    example: 'A 6-week journey for singles to dive into self-discovery.',
    maxLength: 5000,
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string.' })
  @Length(10, 5000, {
    message: 'Description should be between 10 and 5000 characters.',
  })
  @sanitizeString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Optional book title (if applicable for reading challenges).',
    example: 'Single, Married, Separated, and Life After',
    maxLength: 200,
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'Book title must be a string.' })
  @Length(1, 200, {
    message: 'Book title should be between 1 and 200 characters.',
  })
  @sanitizeString()
  bookTitle?: string;

  @ApiPropertyOptional({
    description: 'Optional book author (if applicable for reading challenges).',
    example: 'Myles Munroe',
    maxLength: 100,
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'Book author must be a string.' })
  @Length(1, 100, {
    message: 'Book author should be between 1 and 100 characters.',
  })
  @sanitizeString()
  bookAuthor?: string;

  @ApiProperty({
    description:
      'The status of the challenge. Options: "DRAFT", "ACTIVE", "ARCHIVED".',
    enum: ChallengeStatus,
    enumName: 'ChallengeStatus',
    example: ChallengeStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(ChallengeStatus, {
    message: 'Status must be one of: DRAFT, ACTIVE, ARCHIVED.',
  })
  status?: ChallengeStatus;

  @ApiPropertyOptional({
    description:
      'Indicates whether this challenge requires dual confirmation for married users.',
    example: false,
    nullable: true,
  })
  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean({ message: 'Require dual confirmation must be a boolean value.' })
  requireDualConfirmation?: boolean;

  @ApiPropertyOptional({
    description:
      'Completion badge code (optional). This code is awarded to participants who complete the challenge.',
    example: 'SELF_DISCOVERY_CHAMPION',
    maxLength: 50,
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'Completion badge code must be a string.' })
  @Length(1, 50, {
    message: 'Completion badge code should be between 1 and 50 characters.',
  })
  completionBadgeCode?: string;

  @ApiProperty({
    description: 'List of tasks that belong to the challenge.',
    type: [CreateChallengeTaskDto],
  })
  @IsOptional()
  @Transform(({ value }) => toJson(value)) // ✅ if tasks arrives as JSON string in FormData
  @IsArray({ message: 'Tasks must be an array.' })
  @ValidateNested({ each: true })
  @Type(() => CreateChallengeTaskDto)
  tasks?: CreateChallengeTaskDto[];
}
