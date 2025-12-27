// src/modules/courses/courses.controller.ts
import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { JwtGuards } from 'src/auth/jwt.guards';
import { ListCoursesQueryDto as CoursesQueryDto } from './dtos/list-courses.query.dto';

@ApiTags('Courses')
@ApiBearerAuth()
@UseGuards(JwtGuards) // remove this if courses should be public
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  /**
   * LIST COURSES
   * Returns a paginated list of courses.
   * Supports:
   * - search by title (q)
   * - filter by status
   * - pagination (page, pageSize)
   * Response: { items, meta }
   */
  @Get()
  @ApiOperation({
    summary: 'List courses',
    description:
      'Returns a paginated list of courses. Supports optional search by title, status filter, and pagination.',
  })
  @ApiOkResponse({ description: 'List courses (paginated)' })
  async listCourses(@Query() query: CoursesQueryDto, @Req() req: any) {
    return this.coursesService.list(req.user.id, query);
  }

  /**
   * GET COURSE (BASIC)
   * Returns the basic details of a single course by ID.
   * Does NOT include lessons/attachments (use /content for full course info).
   */
  @Get(':courseId')
  @ApiOperation({
    summary: 'Get course by ID',
    description:
      'Returns basic course information by courseId. Does not include lessons or course stats. Use /courses/:courseId/content for full content.',
  })
  @ApiParam({
    name: 'courseId',
    type: Number,
    description: 'The numeric ID of the course',
    example: 12,
  })
  @ApiOkResponse({ description: 'Get course by id' })
  async getCourse(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.coursesService.findOne(courseId);
  }

  /**
   * LIST COURSE LESSONS
   * Returns the ordered lessons for a course.
   * Useful for:
   * - building a lesson sidebar
   * - rendering lesson list pages
   */
  @Get(':courseId/lessons')
  @ApiOperation({
    summary: 'List lessons for a course',
    description:
      'Returns ordered lessons for the specified course. This is typically used for displaying a lesson list/outline for a course.',
  })
  @ApiParam({
    name: 'courseId',
    type: Number,
    description: 'The numeric ID of the course',
    example: 12,
  })
  @ApiOkResponse({ description: 'List course lessons (ordered)' })
  async listCourseLessons(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.coursesService.listCourseLessons(courseId);
  }

  /**
   * GET COURSE CONTENT (FULL)
   * Returns a full course view including:
   * - course info
   * - ordered lessons
   * - lesson attachments (if included by service)
   * - course stats (lesson count, attachments count, etc.)
   *
   * Use this endpoint to render a full course page or learning dashboard.
   */
  @Get(':courseId/content')
  @ApiOperation({
    summary: 'Get full course content (course + lessons + stats)',
    description:
      'Returns a full course payload including course information, ordered lessons, and course stats. This is best for rendering a complete course view.',
  })
  @ApiParam({
    name: 'courseId',
    type: Number,
    description: 'The numeric ID of the course',
    example: 12,
  })
  @ApiOkResponse({
    description: 'Get full course content (course + lessons + stats)',
  })
  async getCourseContent(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.coursesService.getCourseContent(courseId);
  }

  @Post(':courseId/enroll')
  @ApiOperation({
    summary: 'Enroll in a course',
    description:
      'Enrolls the authenticated user into a course. ' +
      'If the course is free, enrollment is completed immediately. ' +
      'If the course is paid, a payment initialization response is returned for completion.',
  })
  @ApiParam({
    name: 'courseId',
    type: Number,
    description: 'The numeric ID of the course to enroll in',
    example: 12,
  })
  @ApiOkResponse({
    description: 'Enrollment successful or payment initiated',
    schema: {
      example: {
        message: 'Enrollment successful',
        data: {
          courseId: 12,
          isFree: true,
          accessStatus: 'ACTIVE',
        },
      },
    },
  })
  async enroll(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Req() req: any,
  ) {
    return this.coursesService.enroll(req, courseId);
  }
}
