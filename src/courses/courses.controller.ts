import { Controller, Get } from '@nestjs/common';
import { CoursesService } from './courses.service';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}
  @Get()
  async getAllCourses() {
    // Logic to get all courses
    const data = await this.coursesService.getAllCourses({});
    return { status: 200, data, message: 'Courses fetched successfully' };
  }
}
