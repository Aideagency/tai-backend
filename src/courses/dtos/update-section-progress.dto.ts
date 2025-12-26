// src/courses/dto/update-section-progress.dto.ts
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { ProgressState } from 'src/database/entities/user-section-progress.entity';

export class UpdateSectionProgressDto {
  @IsOptional()
  @IsEnum(ProgressState)
  status?: ProgressState;

  @IsOptional()
  @IsBoolean()
  manuallyCompleted?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  lastPositionSeconds?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  totalWatchedSeconds?: number;
}

export class UserCourseParams {
  userId: number;
  courseId: number;
}

export class UserSectionParams extends UserCourseParams {
  sectionId: number;
}
