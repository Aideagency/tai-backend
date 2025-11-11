import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZohoService } from './zoho.service';
import { ListCoursesQueryDto } from './dtos/list-course-query.dto';
import { AddMemberDto } from './dtos/add-member.dto';
import { EnrollUserDto } from './dtos/enroll-user.dto';

@ApiTags('Zoho Learn')
@Controller('zoho')
export class ZohoController {
  constructor(private readonly zohoService: ZohoService) {}

  @Get('courses')
  @ApiOperation({ summary: 'List courses in Zoho Learn' })
  async listCourses(@Query() query: ListCoursesQueryDto) {
    return this.zohoService.listCourses(query);
  }

  @Post('enroll')
  @ApiOperation({ summary: 'Enroll a user in a Zoho Learn course' })
  async enrollUser(@Body() enrollDto: EnrollUserDto) {
    return this.zohoService.enrollUser(enrollDto);
  }

  @Post('add-member')
  @ApiOperation({ summary: 'Add a member to a Zoho Learn course' })
  async addMember(@Body() addMemberDto: AddMemberDto) {
    return this.zohoService.addMember(addMemberDto);
  }
}
