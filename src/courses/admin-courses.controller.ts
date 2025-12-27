// src/modules/courses/admin-courses.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiExcludeController,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

import { AdminCoursesService } from './admin-courses.service';
import { CreateCourseDto } from './dtos/create-course.dto';
import { UpdateCourseDto } from './dtos/update-course.dto';

import { CreateLessonDto } from './dtos/create-lesson.dto';
import { UpdateLessonDto } from './dtos/update-lesson.dto';
import { AdminListCoursesQueryDto } from './dtos/admin-list-courses.query.dto';

import { CreateLessonAttachmentDto } from './dtos/create-lesson-attachment.dto';

// -----------------------------
// Response DTOs (keep in a file if you prefer)
// -----------------------------

class ApiMessageResponse {
  message: string;
}

class ApiMessageDataResponse<T> {
  message: string;
  data: T;
}

// If you already have proper response DTOs/entities, use those.
// For swagger we can reference entity classes directly,
// but response DTOs are usually cleaner.
import { CourseEntity } from 'src/database/entities/course.entity';
import { LessonEntity } from 'src/database/entities/lesson.entity';
import { LessonAttachmentEntity } from 'src/database/entities/lesson-attachment.entity';

class CreateCourseResponse extends ApiMessageDataResponse<CourseEntity> {}
class UpdateCourseResponse extends ApiMessageDataResponse<CourseEntity> {}
class GetCourseResponse extends ApiMessageDataResponse<CourseEntity> {}
class DeleteCourseResponse extends ApiMessageResponse {}

class ListLessonsResponse extends ApiMessageDataResponse<LessonEntity[]> {}

class CreateLessonResponse extends ApiMessageDataResponse<LessonEntity> {}
class UpdateLessonResponse extends ApiMessageDataResponse<LessonEntity> {}
class ReorderLessonResponse extends ApiMessageDataResponse<{
  message: string;
  lessons: LessonEntity[];
}> {}
class DeleteLessonResponse extends ApiMessageResponse {}

class AddLessonAttachmentResponse extends ApiMessageDataResponse<LessonAttachmentEntity> {}
class RemoveLessonAttachmentResponse extends ApiMessageResponse {}

// @ApiExcludeController()
@ApiTags('Admin Courses')
@Controller('admin/courses')
export class AdminCoursesController {
  constructor(private readonly coursesService: AdminCoursesService) {}

  // -----------------------
  // Courses CRUD
  // -----------------------
  @Get()
  @ApiOperation({
    summary: 'List all course',
    description: 'List all courses with pagination and other filters',
  })
  @ApiCreatedResponse({
    description: 'Fetched courses successfully',
  })
  async listCourses(@Query() query: AdminListCoursesQueryDto) {
    const courses = await this.coursesService.listCourses(query);
    return { message: 'Course created successfully', data: courses };
  }

  @Post()
  @ApiOperation({
    summary: 'Create a course',
    description:
      'Creates a new course. Accepts multipart/form-data. Optionally uploads a thumbnail (image) to Cloudinary and stores thumbnailUrl/thumbnailPublicId on the course.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateCourseDto })
  @ApiCreatedResponse({
    description: 'Course created successfully',
    type: CreateCourseResponse,
  })
  @UseInterceptors(FileFieldsInterceptor([{ name: 'thumbnail', maxCount: 1 }]))
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  )
  async createCourse(
    @Body() dto: CreateCourseDto,
    @UploadedFiles() files: { thumbnail?: Express.Multer.File[] },
  ): Promise<CreateCourseResponse> {
    const course = await this.coursesService.createCourse(dto, files);
    return { message: 'Course created successfully', data: course };
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update a course',
    description:
      'Updates a course by id. Accepts multipart/form-data. Optionally replaces the thumbnail: deletes old thumbnail from Cloudinary (if present) before uploading the new one.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'The numeric ID of the course',
    example: 12,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateCourseDto })
  @ApiOkResponse({
    description: 'Course updated successfully',
    type: UpdateCourseResponse,
  })
  @UseInterceptors(FileFieldsInterceptor([{ name: 'thumbnail', maxCount: 1 }]))
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  )
  async updateCourse(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCourseDto,
    @UploadedFiles() files: { thumbnail?: Express.Multer.File[] },
  ): Promise<UpdateCourseResponse> {
    const course = await this.coursesService.updateCourse(id, dto, files);
    return { message: 'Course updated successfully', data: course };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a course (admin)',
    description:
      'Returns basic course details by course id. This is an admin endpoint (typically used by backoffice screens).',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'The numeric ID of the course',
    example: 12,
  })
  @ApiOkResponse({
    description: 'Course returned successfully',
    type: GetCourseResponse,
  })
  async getCourse(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<GetCourseResponse> {
    const course = await this.coursesService.getCourse(id);
    return { message: 'Course returned successfully', data: course };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a course',
    description:
      'Soft-deletes a course by id. Also deletes the thumbnail from Cloudinary if the course has a thumbnailPublicId.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'The numeric ID of the course',
    example: 12,
  })
  @ApiOkResponse({
    description: 'Course deleted successfully',
    type: DeleteCourseResponse,
  })
  async deleteCourse(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DeleteCourseResponse> {
    await this.coursesService.deleteCourse(id);
    return { message: 'Course deleted successfully' };
  }

  @Get(':courseId/full')
  @ApiOperation({
    summary: 'Get full course payload (admin)',
    description:
      'Returns full course payload: course details, ordered lessons, lesson attachments, and course stats (lessonCount, attachmentCount). Useful for admin dashboards.',
  })
  @ApiParam({
    name: 'courseId',
    type: Number,
    description: 'The numeric ID of the course',
    example: 12,
  })
  @ApiOkResponse({
    description: 'Full course returned successfully',
    // type: FullCourseResponse,
  })
  async getCourseFullAdmin(@Param('courseId', ParseIntPipe) courseId: number) {
    const data = await this.coursesService.getCourseFullAdmin(courseId);
    return { message: 'Full course returned successfully', data };
  }

  // -----------------------
  // Lessons (nested under course)
  // -----------------------

  @Get(':courseId/lessons')
  @ApiOperation({
    summary: 'List lessons for a course (admin)',
    description:
      'Returns lessons for the specified course, ordered by sortOrder. Used to manage lesson outline in admin dashboards.',
  })
  @ApiParam({
    name: 'courseId',
    type: Number,
    description: 'The numeric ID of the course',
    example: 12,
  })
  @ApiOkResponse({
    description: 'Lessons returned successfully',
    type: ListLessonsResponse,
  })
  async listLessonsAdmin(
    @Param('courseId', ParseIntPipe) courseId: number,
  ): Promise<ListLessonsResponse> {
    const lessons = await this.coursesService.listCourseLessonsAdmin(courseId);
    return { message: 'Lessons returned successfully', data: lessons };
  }

  @Post(':courseId/lessons')
  @ApiOperation({
    summary: 'Add a lesson to a course',
    description:
      'Creates a new lesson under a course. Supports title, optional descriptionHtml (rich text), optional youtubeUrl, and optional sortOrder. If sortOrder is omitted, service places it at the end.',
  })
  @ApiParam({
    name: 'courseId',
    type: Number,
    description: 'The numeric ID of the course',
    example: 12,
  })
  @ApiCreatedResponse({
    description: 'Lesson created successfully',
    type: CreateLessonResponse,
  })
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async addLesson(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() dto: CreateLessonDto,
  ): Promise<CreateLessonResponse> {
    const lesson = await this.coursesService.addLessonToCourse(courseId, dto);
    return { message: 'Lesson created successfully', data: lesson };
  }

  @Put(':courseId/lessons/:lessonId')
  @ApiOperation({
    summary: 'Update a lesson',
    description:
      'Updates a lesson under the specified course. Can update title, descriptionHtml, youtubeUrl, and sortOrder.',
  })
  @ApiParam({ name: 'courseId', type: Number, example: 12 })
  @ApiParam({ name: 'lessonId', type: Number, example: 44 })
  @ApiOkResponse({
    description: 'Lesson updated successfully',
    type: UpdateLessonResponse,
  })
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async updateLesson(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @Body() dto: UpdateLessonDto,
  ): Promise<UpdateLessonResponse> {
    const lesson = await this.coursesService.updateCourseLesson(
      courseId,
      lessonId,
      dto,
    );
    return { message: 'Lesson updated successfully', data: lesson };
  }

  @Put(':courseId/lessons/:lessonId/reorder/:toOrder')
  @ApiOperation({
    summary: 'Reorder a lesson',
    description:
      'Moves a lesson to a new sortOrder within a course. The service shifts other lessons so ordering remains consistent and unique.',
  })
  @ApiParam({ name: 'courseId', type: Number, example: 12 })
  @ApiParam({ name: 'lessonId', type: Number, example: 44 })
  @ApiParam({ name: 'toOrder', type: Number, example: 3 })
  @ApiOkResponse({
    description: 'Lesson reordered successfully',
    type: ReorderLessonResponse,
  })
  async reorderLesson(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @Param('toOrder', ParseIntPipe) toOrder: number,
  ) {
    const lessons = await this.coursesService.reorderCourseLesson(
      courseId,
      lessonId,
      toOrder,
    );
    return {
      message: 'Lesson reordered successfully',
      data: { message: 'OK', lessons },
    };
  }

  @Delete(':courseId/lessons/:lessonId')
  @ApiOperation({
    summary: 'Delete a lesson',
    description:
      'Deletes a lesson under a course. Any attachments should be removed automatically if cascade delete is configured.',
  })
  @ApiParam({ name: 'courseId', type: Number, example: 12 })
  @ApiParam({ name: 'lessonId', type: Number, example: 44 })
  @ApiOkResponse({
    description: 'Lesson deleted successfully',
    type: DeleteLessonResponse,
  })
  async deleteLesson(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('lessonId', ParseIntPipe) lessonId: number,
  ): Promise<DeleteLessonResponse> {
    await this.coursesService.deleteCourseLesson(courseId, lessonId);
    return { message: 'Lesson deleted successfully' };
  }

  // -----------------------
  // Lesson Attachments (nested under lesson)
  // -----------------------

  @Post(':courseId/lessons/:lessonId/attachments')
  @ApiOperation({
    summary: 'Add an attachment to a lesson',
    description:
      'Uploads an attachment file (multipart/form-data) and links it to a lesson. Stores title, optional type, and Cloudinary metadata (url/publicId/resourceType).',
  })
  @ApiParam({ name: 'courseId', type: Number, example: 12 })
  @ApiParam({ name: 'lessonId', type: Number, example: 44 })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateLessonAttachmentDto })
  @ApiCreatedResponse({
    description: 'Attachment added successfully',
    type: AddLessonAttachmentResponse,
  })
  @UseInterceptors(FileFieldsInterceptor([{ name: 'file', maxCount: 1 }]))
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async addLessonAttachment(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @Body() dto: CreateLessonAttachmentDto,
    @UploadedFiles() files: { file?: Express.Multer.File[] },
  ): Promise<AddLessonAttachmentResponse> {
    const file = files?.file?.[0];
    if (!file) throw new BadRequestException('file is required');

    const attachment = await this.coursesService.addLessonAttachment(
      courseId,
      lessonId,
      dto,
      file,
    );

    return { message: 'Attachment added successfully', data: attachment };
  }

  @Delete(':courseId/lessons/:lessonId/attachments/:attachmentId')
  @ApiOperation({
    summary: 'Remove a lesson attachment',
    description:
      'Removes an attachment from a lesson. Also deletes the file from Cloudinary if the attachment has a publicId.',
  })
  @ApiParam({ name: 'courseId', type: Number, example: 12 })
  @ApiParam({ name: 'lessonId', type: Number, example: 44 })
  @ApiParam({ name: 'attachmentId', type: Number, example: 101 })
  @ApiOkResponse({
    description: 'Attachment removed successfully',
    type: RemoveLessonAttachmentResponse,
  })
  async removeLessonAttachment(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @Param('attachmentId', ParseIntPipe) attachmentId: number,
  ): Promise<RemoveLessonAttachmentResponse> {
    await this.coursesService.removeLessonAttachment(
      courseId,
      lessonId,
      attachmentId,
    );
    return { message: 'Attachment removed successfully' };
  }
}
