// src/challenges/dtos/update-challenge-task.dto.ts
import {
  IsInt,
  Min,
  Max,
  IsOptional,
  IsBoolean,
  IsString,
  Length,
  IsEnum,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TaskCadence } from 'src/database/entities/challenge-task.entity';

export class UpdateChallengeTaskDto {
  @ApiPropertyOptional({
    description: 'The title of the task. Optional during update.',
    example: 'Read 2 chapters of the book',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @Length(3, 200)
  title?: string;

  @ApiPropertyOptional({
    description: 'Detailed instructions for the task. Optional during update.',
    example: 'Read 2 chapters from the designated book.',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @Length(10, 1000)
  instructions?: string;

  @ApiPropertyOptional({
    description: 'Day number for a daily task.',
    example: 1,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  dayNumber?: number;

  @ApiPropertyOptional({
    description: 'Week number for weekly tasks.',
    example: 1,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(52)
  weekNumber?: number;

  @ApiPropertyOptional({
    description: 'Whether the task is a milestone.',
    example: true,
    nullable: true,
  })
  @IsOptional()
  @IsBoolean()
  isMilestone?: boolean;

  @ApiPropertyOptional({
    description: 'Task frequency (DAILY or WEEKLY). Optional during update.',
    enum: TaskCadence,
    example: TaskCadence.DAILY,
    nullable: true,
  })
  @IsOptional()
  @IsEnum(TaskCadence)
  frequency?: TaskCadence;
}
