import { Injectable } from '@nestjs/common';
import { ZohoService } from './zoho.service'; // Adjust the path based on your file structure

@Injectable()
export class CoursesService {
  constructor(private zohoService: ZohoService) {}

  // Method to fetch all courses
  async getAllCourses(queryParams: any) {
    try {
      const courses = await this.zohoService.listCourses(queryParams);
      return courses;
    } catch (error) {
      // Handle any errors here
      throw new Error('Failed to fetch courses from Zoho');
    }
  }
}
