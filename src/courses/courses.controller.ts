// src/courses/courses.controller.ts
import { Controller, Get, Param, Post, Body, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { CoursesService } from './courses.service';
import { LessonProgressStatus } from 'src/database/entities/user-lesson-progress.entity';
import { ZohoSyncService } from './zoho-sync.service';
import { ZohoService } from './zoho.service';

@ApiTags('Courses')
@Controller('courses')
export class CoursesController {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly zohoSyncService: ZohoSyncService,
    private readonly zoho: ZohoService,
  ) {}

  @Get('zoho')
  @ApiOperation({
    summary: 'List all available courses',
    description:
      'Returns all published courses synced from Zoho Learn. Supports filtering and pagination.',
  })
  async listZohoCourses(@Query() query: any) {
    const data = await this.zoho.listCourses({ view: 'all' });
    return { status: 200, data, message: 'Courses fetched successfully' };
  }

  @Get('zoho-course/:url')
  @ApiOperation({
    summary: 'List all available courses',
    description:
      'Returns all published courses synced from Zoho Learn. Supports filtering and pagination.',
  })
  async listZohoCoursesLessons(@Param('url') url: string) {
    const data = await this.zoho.listCourses({ view: 'all' });
    return { status: 200, data, message: 'Courses fetched successfully' };
  }

  @Get('zoho-course-resources/:courseId')
  @ApiOperation({
    summary: 'List all available course resources',
    description:
      'Returns all published courses synced from Zoho Learn. Supports filtering and pagination.',
  })
  async listZohoCourseResources(@Param('courseId') courseId: string) {
    const data = await this.zoho.getCourseResources(courseId);
    return { status: 200, data, message: 'Courses resources successfully' };
  }

  /**
   * Fetches a list of available courses.
   * - Returns locally stored courses synced from Zoho Learn
   * - Supports filtering, pagination, and search via query params
   * - Does NOT require user enrollment
   */
  @Get()
  @ApiOperation({
    summary: 'List all available courses',
    description:
      'Returns all published courses synced from Zoho Learn. Supports filtering and pagination.',
  })
  async list(@Query() query: any) {
    const data = await this.coursesService.listCourses(query);
    return { status: 200, data, message: 'Courses fetched successfully' };
  }

  /**
   * Triggers a manual sync of courses and lessons from Zoho Learn.
   * - Pulls latest courses, lessons, articles, and metadata
   * - Upserts data into the local database
   * - Intended for admin / cron usage
   */
  @Get('sync-courses')
  @ApiOperation({
    summary: 'Manually sync courses from Zoho Learn',
    description:
      'Triggers a full synchronization of courses and lessons from Zoho Learn into the local database.',
  })
  async sync() {
    await this.zohoSyncService.syncDaily();
    return { status: 200, message: 'Courses synced successfully' };
  }

  /**
   * Fetches the course outline (lesson structure).
   * - Includes chapters, lessons, articles, videos, etc.
   * - Does NOT include user-specific progress
   */
  @Get(':courseId/outline')
  @ApiOperation({
    summary: 'Get course outline',
    description:
      'Returns the full lesson structure for a course including chapters and lessons.',
  })
  @ApiParam({ name: 'courseId', description: 'Local course ID' })
  async outline(@Param('courseId') courseId: string) {
    const data = await this.coursesService.getCourseOutline(Number(courseId));
    return {
      status: 200,
      data,
      message: 'Course outline fetched successfully',
    };
  }

  /**
   * Enrolls the authenticated user into a course.
   * - Creates a UserCourseProgress record
   * - Initializes lesson progress tracking
   * - Validates course access (FREE / PAID)
   */
  @Post(':courseId/enroll')
  @ApiOperation({
    summary: 'Enroll in a course',
    description:
      'Enrolls the authenticated user into the specified course and initializes progress tracking.',
  })
  @ApiParam({ name: 'courseId', description: 'Local course ID' })
  async enroll(@Req() req: any, @Param('courseId') courseId: string) {
    const userId = Number(req.user.id);
    const data = await this.coursesService.enroll(userId, Number(courseId));
    return { status: 200, data, message: 'Enrolled successfully' };
  }

  /**
   * Fetches the authenticated user’s progress for a course.
   * - Includes overall progress percentage
   * - Includes per-lesson completion status
   */
  @Get(':courseId/progress')
  @ApiOperation({
    summary: 'Get my course progress',
    description:
      'Returns the authenticated user’s progress for a specific course.',
  })
  @ApiParam({ name: 'courseId', description: 'Local course ID' })
  async myProgress(@Req() req: any, @Param('courseId') courseId: string) {
    const userId = Number(req.user.id);
    const data = await this.coursesService.getMyCourseProgress(
      userId,
      Number(courseId),
    );
    return { status: 200, data, message: 'Progress fetched successfully' };
  }

  /**
   * Marks a lesson as opened by the user.
   * - Used for analytics and "last accessed" tracking
   * - Does NOT mark the lesson as completed
   */
  @Post(':courseId/lessons/:lessonId/open')
  @ApiOperation({
    summary: 'Open a lesson',
    description:
      'Marks a lesson as opened by the user for tracking and analytics purposes.',
  })
  @ApiParam({ name: 'courseId', description: 'Local course ID' })
  @ApiParam({ name: 'lessonId', description: 'Local lesson ID' })
  async openLesson(
    @Req() req: any,
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
  ) {
    const userId = Number(req.user.id);
    const data = await this.coursesService.openLesson(
      userId,
      Number(courseId),
      Number(lessonId),
    );
    return { status: 200, data, message: 'Lesson opened' };
  }

  /**
   * Updates lesson progress for the authenticated user.
   * - Can mark lesson as IN_PROGRESS or COMPLETED
   * - Updates progress percentage
   * - Triggers course-level progress recalculation
   */
  @Post(':courseId/lessons/:lessonId/progress')
  @ApiOperation({
    summary: 'Update lesson progress',
    description:
      'Updates the user’s progress for a lesson, including completion status and progress percentage.',
  })
  @ApiParam({ name: 'courseId', description: 'Local course ID' })
  @ApiParam({ name: 'lessonId', description: 'Local lesson ID' })
  async updateLessonProgress(
    @Req() req: any,
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Body() body: { status?: LessonProgressStatus; progressPercent?: number },
  ) {
    const userId = Number(req.user.id);
    const data = await this.coursesService.updateLessonProgress(
      userId,
      Number(courseId),
      Number(lessonId),
      body,
    );
    return { status: 200, data, message: 'Lesson progress updated' };
  }
}
