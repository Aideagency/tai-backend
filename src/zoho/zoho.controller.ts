// zoho.controller.ts
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ZohoService } from './zoho.service';
import { EnrollUserDto } from './dtos/enroll-user.dto';
import { CourseUrlQueryDto } from './dtos/course-query.dto';
import { InviteUserDto } from './dtos/invite-user.dto';
import { AddMemberDto } from './dtos/add-member.dto';
import { ListCoursesQueryDto } from './dtos/list-courses-query.dto';
import { ApiExcludeController } from '@nestjs/swagger';

@Controller('zoho')
@ApiExcludeController()
export class ZohoController {
  constructor(private readonly zohoService: ZohoService) {}

  /**
   * GET /zoho/courses
   * Query params: page, limit, search, status (optional)
   */
  @Get('courses')
  async listCourses(@Query() query: ListCoursesQueryDto) {
    return this.zohoService.listCourses(query);
  }

  /**
   * POST /zoho/enroll
   * Body: { courseId, userId }
   */
  @Post('enroll')
  async enrollUser(@Body() enrollDto: EnrollUserDto) {
    return this.zohoService.enrollUser(enrollDto);
  }

  /**
   * POST /zoho/member
   * Body: { courseId, userId }
   */
  @Post('member')
  async addMember(@Body() addMemberDto: AddMemberDto) {
    return this.zohoService.addMember(addMemberDto);
  }

  /**
   * GET /zoho/courses/:courseId/requests
   */
  @Get('courses/:courseId/requests')
  async getEnrollmentRequests(@Param('courseId') courseId: string) {
    return this.zohoService.getEnrollmentRequests(courseId);
  }

  /**
   * GET /zoho/courses/:courseId/members
   */
  @Get('courses/:courseId/members')
  async getCourseMembers(@Param('courseId') courseId: string) {
    return this.zohoService.getCourseMembers(courseId);
  }

  /**
   * GET /zoho/course-by-url?courseUrl=...
   */
  @Get('course-by-url')
  async getCourseDataByUrl(@Query() query: CourseUrlQueryDto) {
    return this.zohoService.getCourseDataByUrl(query.courseUrl);
  }

  /**
   * GET /zoho/courses/:courseId/resources
   */
  @Get('courses/:courseId/resources')
  async getCourseResources(@Param('courseId') courseId: string) {
    return this.zohoService.getCourseResources(courseId);
  }

  /**
   * POST /zoho/courses/:courseId/complete
   */
  @Post('courses/:courseId/complete')
  async completeCourse(@Param('courseId') courseId: string) {
    return this.zohoService.completeCourse(courseId);
  }

  /**
   * POST /zoho/portal/invite
   * Body: { email, firstName?, lastName? }
   */
  @Post('portal/invite')
  async inviteUserToCustomPortal(@Body() body: InviteUserDto) {
    const { email, firstName, lastName } = body;
    return this.zohoService.inviteUserToCustomPortal(
      email,
      firstName,
      lastName,
    );
  }
}
