// // src/courses/admin/dto/admin-lesson.dto.ts
// import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
// import { LessonStatus } from 'src/database/entities/lesson.entity';
// import { Type } from 'class-transformer';

// export class CreateLessonDto {
//   @Type(() => Number)
//   @IsInt()
//   @Min(1)
//   courseId: number;

//   @IsString()
//   title: string;

//   @IsOptional()
//   @IsString()
//   descriptionHtml?: string;

//   @IsOptional()
//   @IsEnum(LessonStatus)
//   status?: LessonStatus;

//   @IsOptional()
//   @Type(() => Number)
//   @IsInt()
//   @Min(0)
//   sortOrder?: number;
// }

// export class UpdateLessonDto {
//   @IsOptional()
//   @IsString()
//   title?: string;

//   @IsOptional()
//   @IsString()
//   descriptionHtml?: string;

//   @IsOptional()
//   @IsEnum(LessonStatus)
//   status?: LessonStatus;

//   @IsOptional()
//   @Type(() => Number)
//   @IsInt()
//   @Min(0)
//   sortOrder?: number;
// }
