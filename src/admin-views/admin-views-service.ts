// src/admin/admin.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  //   UserRepository,
  UserSearchParams,
} from 'src/repository/user/user.repository';
import { CommunityTag, MaritalStatus } from 'src/database/entities/user.entity';
import { Helper } from 'src/utils/helper';
import { AdminEntity } from 'src/database/entities/admin.entity';
import { TracerLogger } from 'src/logger/logger.service';
import * as bcrypt from 'bcrypt';
import { AdminRepository } from 'src/repository/admin/admin.repository';
import { JwtService } from '@nestjs/jwt';
import { AdminService } from 'src/admin/admin.service';
import { GetEventsFilterDto } from 'src/event/dtos/get-events-query.dto';
import { EventService } from 'src/event/event.service';
import { ChallengesService } from 'src/challenges/challenges.service';
import { GetChallengesQueryDto } from 'src/challenges/dtos/get-challenges-query.dto';
import { CounsellingService } from 'src/counselling/counselling.service';
import { GetCounsellingsFilterDto } from 'src/counselling/dtos/get-counselling-filter.dto';
import { GetCounsellingBookingsFilterDto } from 'src/counselling/dtos/get-counselling-booking-filter.dto';
import { AdminBooksService } from 'src/books/books.admin.service';
import { AdminBooksQueryDto } from 'src/books/dtos/admin-books-query.dto';
import { AdminCoursesService } from 'src/courses/admin-courses.service';
import { AdminListCoursesQueryDto } from 'src/courses/dtos/admin-list-courses.query.dto';

@Injectable()
export class AdminViewsService {
  private readonly JWT_SECRET = process.env.JWT_SECRET;
  private readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
  private readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
  private readonly JWT_REFRESH_EXPIRES_IN =
    process.env.JWT_REFRESH_EXPIRES_IN || '1d';

  constructor(
    // private readonly userRepo: UserRepository,
    private readonly logger: TracerLogger,
    private adminService: AdminService,
    private readonly eventService: EventService,
    private readonly challengeService: ChallengesService,
    private readonly counsellingService: CounsellingService,
    private readonly bookService: AdminBooksService,
    private readonly courseService: AdminCoursesService,
  ) {}

  async listUsers(params: UserSearchParams) {
    return this.adminService.listUsers(params);
  }

  async listEvents(params: GetEventsFilterDto) {
    return this.eventService.getAllEvents(params);
  }

  async listChallengess(params: GetChallengesQueryDto) {
    return this.challengeService.listEveryChallenge(params);
  }

  async listCounselling(params: GetCounsellingsFilterDto) {
    return this.counsellingService.getAllCounsellings(params);
  }

  async listCounsellingBookings(
    counsellingId: number,
    params: GetCounsellingBookingsFilterDto,
  ) {
    const counselling =
      await this.counsellingService.getCounsellingById(counsellingId);
    const response =
      await this.counsellingService.getCounsellingBookingsPaginated(
        counsellingId,
        params,
      );
    return {
      counselling,
      ...response,
    };
  }

  async listBooks(params: AdminBooksQueryDto) {
    return this.bookService.listBooksAdminPaginated(params);
  }

  async listCourses(params: AdminListCoursesQueryDto) {
    return this.courseService.listCourses(params);
  }

  async getCourseDetails(courseId: number) {
    return this.courseService.getCourseFullAdmin(courseId);
  }
}
