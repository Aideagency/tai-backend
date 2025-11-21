// src/challenges/dtos/create-challenge-task.dto.ts
import {
  IsInt,
  Min,
  Max,
  IsOptional,
  IsBoolean,
  IsString,
  Length,
  IsEnum,
  IsArray,
  ValidateNested,
  ArrayNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChallengeFrequency } from 'src/database/entities/challenge.entity';
import { TaskCadence } from 'src/database/entities/challenge-task.entity';
import { Type } from 'class-transformer';

export class CreateChallengeTaskDto {
  @ApiProperty({
    description:
      'The title of the task. This should be descriptive of the action to be taken (e.g., "Read 2 chapters of the book").',
    example: 'Read 2 chapters of the book',
    maxLength: 200,
  })
  @IsString()
  @Length(3, 200)
  title: string;

  @ApiProperty({
    description:
      'Detailed description of the task. This can explain the instructions or purpose of the task.',
    example:
      'Read 2 chapters from the book "Single, Married, Separated, and Life After".',
    maxLength: 1000,
  })
  @IsString()
  @Length(10, 1000)
  instructions: string;

  @ApiProperty({
    description: 'The day number or week number for scheduling this task.',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  dayNumber?: number; // Optional for daily tasks

  @ApiPropertyOptional({
    description: 'The week number (if the task is weekly).',
    example: 1,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(52)
  weekNumber?: number; // Required for weekly tasks, but optional for daily tasks

  @ApiPropertyOptional({
    description:
      'Whether this task is a milestone task (e.g., a weekly review task).',
    example: true,
    nullable: true,
  })
  @IsOptional()
  @IsBoolean()
  isMilestone?: boolean;

  @ApiProperty({
    description: 'Challenge Frequency for tasks (DAILY or WEEKLY)',
    enum: TaskCadence,
    example: TaskCadence.DAILY,
  })
  @IsEnum(TaskCadence)
  frequency: TaskCadence;

  /**
   * This method will enforce the `dayNumber` or `weekNumber` to be set based on frequency.
   * If frequency is DAILY, dayNumber must be set.
   * If frequency is WEEKLY, weekNumber must be set.
   */
  validate() {
    if (this.frequency === TaskCadence.DAILY && !this.dayNumber) {
      throw new Error('For daily tasks, dayNumber is required.');
    }

    if (this.frequency === TaskCadence.WEEKLY && !this.weekNumber) {
      throw new Error('For weekly tasks, weekNumber is required.');
    }

    // Additional validation could be added as needed (e.g., enforcing milestones).
  }
}

export class AddTasksDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateChallengeTaskDto)
  tasks: CreateChallengeTaskDto[];
}

export class RemoveTasksDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  taskIds: number[];
}
