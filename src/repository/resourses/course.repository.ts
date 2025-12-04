import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { BaseRepository } from '../base.repository';
import { CourseEntity } from 'src/database/entities/course.entity';
import { ZohoService } from 'src/courses/zoho.service';

@Injectable()
export class CourseRepository extends BaseRepository<
  CourseEntity,
  Repository<CourseEntity>
> {
  protected logger = new Logger(CourseRepository.name);

  constructor(
    @InjectRepository(CourseEntity) repository: Repository<CourseEntity>,
    private readonly zohoService: ZohoService, // Inject ZohoService for syncing
  ) {
    super(repository);
  }

  // Fetch all courses and sync with Zoho (or fetch directly from Zoho)
//   async fetchAndSyncCourses() {
//     try {
//       const zohoCourses = await this.zohoService.listCourses({}); // Fetch all courses from Zoho

//       // Sync with local DB (you could filter or handle them differently)
//       for (const course of zohoCourses) {
//         await this.repository.save({
//           ...course,
//           zoho_course_id: course.zoho_course_id,
//           title: course.title,
//           description: course.description,
//           accessType: course.accessType || 'FREE', // Default to FREE if not provided
//           price: course.price || null,
//           isPublished: course.isPublished || true,
//         });
//       }

//       return zohoCourses;
//     } catch (error) {
//       this.logger.error('Error syncing courses from Zoho', error);
//       throw new BadRequestException('Error syncing courses from Zoho');
//     }
//   }

  // Find course by Zoho ID
  async findByZohoCourseId(
    zohoCourseId: string,
  ): Promise<CourseEntity | undefined> {
    return this.findOne({ zoho_course_id: zohoCourseId });
  }
}
