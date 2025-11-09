import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';

export class ListAvailableChallengesQueryDto {
  @ApiPropertyOptional({
    description: 'Search query to filter challenges by title or description.',
    example: 'Self-Discovery Reading Challenge',
    maxLength: 100,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    description: 'The page number for pagination. Default is 1.',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description:
      'The number of items per page. Default is 20, with a max of 100.',
    example: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;
}

export class EnrollChallengeDto {
  @ApiPropertyOptional({
    description: 'The optional start date for enrolling in the challenge.',
    example: '2023-10-01T00:00:00Z',
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;
}

export class ToggleTaskCompletionDto {
  @ApiProperty({
    description: 'Indicates whether the task has been completed by the user.',
    example: true,
  })
  @IsBoolean()
  completed: boolean;

  @ApiProperty({
    description: 'The unique identifier for the challenge being updated.',
    example: 1,
  })
  @IsInt()
  challengeId: number;

  @ApiProperty({
    description: 'The unique identifier for the task being updated.',
    example: 2,
  })
  @IsInt()
  taskId: number;
}

export class PartnerConfirmDto {
  @ApiProperty({
    description: 'The unique identifier for the user challenge.',
    example: 3,
  })
  @IsInt()
  userChallengeId: number;

  @ApiProperty({
    description: 'The unique identifier for the task being confirmed.',
    example: 2,
  })
  @IsInt()
  taskId: number;

  @ApiPropertyOptional({
    description:
      'The unique user ID of the partner confirming the task (if applicable).',
    example: 4,
    nullable: true,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  partnerUserId?: number;
}

export class ReflectionCreateDto {
  @ApiPropertyOptional({
    description: 'The week number for the reflection (if applicable).',
    example: 1,
    nullable: true,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  weekNumber?: number;

  @ApiProperty({
    description:
      'The content of the reflection (e.g., user thoughts, progress, learnings).',
    example: 'I have made great progress this week in my challenge.',
    minLength: 1,
  })
  @IsString()
  content: string;
}

export class PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'The page number for pagination. Default is 1.',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'The limit on the number of items per page. Default is 20.',
    example: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;
}

export class CombinedChallengesQueryDto extends OmitType(
  ListAvailableChallengesQueryDto,
  ['q'] as const,
) {}
