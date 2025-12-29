// src/challenges/dtos/create-challenge.dto.ts
import {
  IsEnum,
  IsInt,
  Min,
  Max,
  IsArray,
  ArrayNotEmpty,
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
  return v; // leave as-is so validation can fail if it's invalid
}

function toJson(v: any) {
  if (v === undefined || v === null || v === '') return undefined;
  if (typeof v === 'object') return v; // already parsed (e.g. JSON body)
  try {
    return JSON.parse(v);
  } catch {
    return v; // let validators complain if it's not valid JSON
  }
}

export class CreateChallengeDto {
  @ApiProperty({
    description: 'The title of the challenge',
    example: 'The Self-Discovery Reading Challenge',
    maxLength: 100,
  })
  @IsString()
  @Length(3, 100)
  title: string;

  @ApiProperty({
    description: 'The community this challenge is for',
    enum: CommunityType,
    enumName: 'CommunityType',
    example: CommunityType.SINGLE,
  })
  @IsEnum(CommunityType)
  community: CommunityType;

  @ApiProperty({
    description: 'The duration of the challenge in days',
    example: 42,
    minimum: 1,
    maximum: 365,
  })
  @Transform(({ value }) => toNumber(value))
  @IsInt()
  @Min(1)
  @Max(365)
  durationDays: number;

  @ApiProperty({
    description: 'The frequency of tasks within the challenge',
    enum: ChallengeFrequency,
    enumName: 'ChallengeFrequency',
    example: ChallengeFrequency.DAILY,
  })
  @IsEnum(ChallengeFrequency)
  frequency: ChallengeFrequency;

  @ApiProperty({
    description: 'Visibility of the challenge',
    enum: Visibility,
    example: Visibility.COMMUNITY_ONLY,
  })
  @IsEnum(Visibility)
  visibility: Visibility;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Cover image upload (jpg/png/webp).',
  })
  coverUrl?: Express.Multer.File;

  @ApiPropertyOptional({
    description: 'Optional detailed description of the challenge.',
    example: 'A 6-week journey for singles to dive into self-discovery.',
    maxLength: 5000,
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string.' })
  @Length(10, 5000, {
    message: 'Description should be between 10 and 5000 characters.',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Optional book title (if applicable).',
    example: 'Single, Married, Separated, and Life After',
    maxLength: 200,
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'Book title must be a string.' })
  @Length(1, 200)
  bookTitle?: string;

  @ApiPropertyOptional({
    description: 'Optional book author (if applicable).',
    example: 'Myles Munroe',
    maxLength: 100,
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'Book author must be a string.' })
  @Length(1, 100)
  bookAuthor?: string;

  @ApiProperty({
    description: 'The status of the challenge.',
    enum: ChallengeStatus,
    enumName: 'ChallengeStatus',
    example: ChallengeStatus.ACTIVE,
  })
  @IsEnum(ChallengeStatus, {
    message: 'Status must be one of: DRAFT, ACTIVE, ARCHIVED.',
  })
  status: ChallengeStatus;

  @ApiPropertyOptional({
    description: 'Whether this challenge requires dual confirmation.',
    example: false,
    nullable: true,
  })
  @Transform(({ value }) => toBoolean(value))
  @IsOptional()
  @IsBoolean({ message: 'Require dual confirmation must be a boolean value.' })
  requireDualConfirmation?: boolean;

  @ApiPropertyOptional({
    description: 'Completion badge code (optional).',
    example: 'SELF_DISCOVERY_CHAMPION',
    maxLength: 50,
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'Completion badge code must be a string.' })
  @Length(1, 50)
  completionBadgeCode?: string;

  // @ApiProperty({
  //   description: 'List of tasks that belong to the challenge.',
  //   type: [CreateChallengeTaskDto],
  // })
  // // ✅ If sent as FormData, tasks will usually arrive as a JSON string.
  // @Transform(({ value }) => toJson(value))
  // @IsArray({ message: 'Tasks must be an array.' })
  // @ArrayNotEmpty({ message: 'At least one task must be provided.' })
  // @ValidateNested({ each: true })
  // @Type(() => CreateChallengeTaskDto)
  // tasks: CreateChallengeTaskDto[];
}
