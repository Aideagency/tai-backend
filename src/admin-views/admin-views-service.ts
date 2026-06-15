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
import { NuggetService } from 'src/nuggets/nuggets.service';
import { NuggetSearchParams } from 'src/repository/nuggets/nugget.repository';
import { NuggetSearchQueryDto } from 'src/nuggets/dtos/nugget-search-query.dto';
import { DataSource, MoreThan } from 'typeorm';
import { UserEntity } from 'src/database/entities/user.entity';
import {
  EventEntity,
  EventStatus,
} from 'src/database/entities/event.entity';
import {
  EventRegistrationEntity,
  RegistrationStatus,
} from 'src/database/entities/event-registration.entity';
import {
  ChallengeEntity,
  ChallengeStatus,
} from 'src/database/entities/challenge.entity';
import { UserChallengeEntity } from 'src/database/entities/user-challenge.entity';
import { CounsellingEntity } from 'src/database/entities/counselling.entity';
import {
  CounsellingBookingEntity,
  CounsellingBookingStatus,
} from 'src/database/entities/counselling-booking.entity';
import { BookEntity } from 'src/database/entities/book.entity';
import {
  OwnershipStatus,
  UserBookDownloadEntity,
} from 'src/database/entities/user-book-download.entity';
import {
  AccessStatus,
  CourseAccessEntity,
} from 'src/database/entities/course-access.entity';
import {
  CourseEntity,
  PublishStatus,
} from 'src/database/entities/course.entity';
import { NuggetEntity } from 'src/database/entities/nugget.entity';
import { DailyNuggetEntity } from 'src/database/entities/daily-nugget.entity';
import { PostEntity } from 'src/database/entities/post.entity';

export type AdminPostStatusFilter = 'all' | 'active' | 'deactivated';

export interface AdminPostsQuery {
  page?: number | string;
  pageSize?: number | string;
  q?: string;
  status?: AdminPostStatusFilter;
  community?: string;
}

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
    private readonly nuggetService: NuggetService,
    private readonly dataSource: DataSource,
  ) {}

  async getDashboardSummary() {
    const now = new Date();

    const userRepo = this.dataSource.getRepository(UserEntity);
    const eventRepo = this.dataSource.getRepository(EventEntity);
    const eventRegistrationRepo = this.dataSource.getRepository(
      EventRegistrationEntity,
    );
    const challengeRepo = this.dataSource.getRepository(ChallengeEntity);
    const userChallengeRepo =
      this.dataSource.getRepository(UserChallengeEntity);
    const counsellingRepo = this.dataSource.getRepository(CounsellingEntity);
    const counsellingBookingRepo = this.dataSource.getRepository(
      CounsellingBookingEntity,
    );
    const bookRepo = this.dataSource.getRepository(BookEntity);
    const bookDownloadRepo = this.dataSource.getRepository(
      UserBookDownloadEntity,
    );
    const courseRepo = this.dataSource.getRepository(CourseEntity);
    const courseAccessRepo = this.dataSource.getRepository(CourseAccessEntity);
    const nuggetRepo = this.dataSource.getRepository(NuggetEntity);
    const dailyNuggetRepo = this.dataSource.getRepository(DailyNuggetEntity);

    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      verifiedUsers,
      totalEvents,
      upcomingEvents,
      eventRegistrations,
      totalChallenges,
      activeChallenges,
      challengeEnrollments,
      totalCounsellings,
      activeCounsellings,
      counsellingBookings,
      totalBooks,
      publishedBooks,
      bookDownloads,
      totalCourses,
      publishedCourses,
      courseEnrollments,
      totalNuggets,
      activeNuggets,
      dailyRotations,
    ] = await Promise.all([
      userRepo.count(),
      userRepo.count({ where: { suspended: false } }),
      userRepo.count({ where: { suspended: true } }),
      userRepo.count({ where: { is_email_verified: true } }),
      eventRepo.count(),
      eventRepo.count({
        where: { status: EventStatus.PUBLISHED, startsAt: MoreThan(now) },
      }),
      eventRegistrationRepo.count({
        where: { status: RegistrationStatus.CONFIRMED },
      }),
      challengeRepo.count(),
      challengeRepo.count({ where: { status: ChallengeStatus.ACTIVE } }),
      userChallengeRepo.count(),
      counsellingRepo.count(),
      counsellingRepo.count({ where: { isActive: true } }),
      counsellingBookingRepo.count({
        where: { status: CounsellingBookingStatus.CONFIRMED },
      }),
      bookRepo.count(),
      bookRepo.count({ where: { isPublished: true } }),
      bookDownloadRepo.count({ where: { status: OwnershipStatus.CONFIRMED } }),
      courseRepo.count(),
      courseRepo.count({ where: { status: PublishStatus.PUBLISHED } }),
      courseAccessRepo.count({ where: { status: AccessStatus.ACTIVE } }),
      nuggetRepo.count(),
      nuggetRepo.count({ where: { isActive: true } }),
      dailyNuggetRepo.count({ where: { expiresAt: MoreThan(now) } }),
    ]);

    return {
      overview: [
        {
          label: 'Total Users',
          value: totalUsers,
          helper: `${verifiedUsers} verified`,
          href: '/admin-views/users',
        },
        {
          label: 'Active Users',
          value: activeUsers,
          helper: `${suspendedUsers} suspended`,
          href: '/admin-views/users',
        },
        {
          label: 'Upcoming Events',
          value: upcomingEvents,
          helper: `${eventRegistrations} confirmed registrations`,
          href: '/admin-views/events',
        },
        {
          label: 'Active Challenges',
          value: activeChallenges,
          helper: `${challengeEnrollments} enrollments`,
          href: '/admin-views/challenges',
        },
      ],
      modules: [
        {
          title: 'Users',
          href: '/admin-views/users',
          value: totalUsers,
          label: 'total accounts',
          details: [
            { label: 'Active', value: activeUsers },
            { label: 'Suspended', value: suspendedUsers },
            { label: 'Verified', value: verifiedUsers },
          ],
        },
        {
          title: 'Events',
          href: '/admin-views/events',
          value: totalEvents,
          label: 'events created',
          details: [
            { label: 'Upcoming', value: upcomingEvents },
            { label: 'Registrations', value: eventRegistrations },
          ],
        },
        {
          title: 'Challenges',
          href: '/admin-views/challenges',
          value: totalChallenges,
          label: 'challenges',
          details: [
            { label: 'Active', value: activeChallenges },
            { label: 'Enrollments', value: challengeEnrollments },
          ],
        },
        {
          title: 'Counselling',
          href: '/admin-views/counsellings',
          value: totalCounsellings,
          label: 'offers',
          details: [
            { label: 'Active', value: activeCounsellings },
            { label: 'Confirmed bookings', value: counsellingBookings },
          ],
        },
        {
          title: 'Books',
          href: '/admin-views/books',
          value: totalBooks,
          label: 'books',
          details: [
            { label: 'Published', value: publishedBooks },
            { label: 'Confirmed downloads', value: bookDownloads },
          ],
        },
        {
          title: 'Courses',
          href: '/admin-views/courses',
          value: totalCourses,
          label: 'courses',
          details: [
            { label: 'Published', value: publishedCourses },
            { label: 'Active enrollments', value: courseEnrollments },
          ],
        },
        {
          title: 'Nuggets',
          href: '/admin-views/nuggets',
          value: totalNuggets,
          label: 'nuggets',
          details: [
            { label: 'Active', value: activeNuggets },
            { label: 'Daily live now', value: dailyRotations },
          ],
        },
      ],
    };
  }

  async listUsers(params: UserSearchParams) {
    return this.adminService.listUsers(params);
  }

  async listEvents(params: GetEventsFilterDto) {
    return this.eventService.getAllEvents(params);
  }

  async listChallengess(params: GetChallengesQueryDto) {
    return this.challengeService.listEveryChallenge(params);
  }

  async getSingleChallenge(challengeId: number) {
    return this.challengeService.getChallenge(challengeId);
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

  async getNuggetInformation(nuggetId: number) {
    return this.nuggetService.getNuggetWithEngagementStats(nuggetId);
  }

  async getAllNuggets(params: NuggetSearchQueryDto) {
    return this.nuggetService.getNuggets(params);
  }

  async listPosts(params: AdminPostsQuery = {}) {
    const page = Math.max(Number(params.page) || 1, 1);
    const pageSize = Math.max(Number(params.pageSize) || 20, 1);
    const status = params.status || 'all';
    const q = (params.q || '').trim();

    const postRepo = this.dataSource.getRepository(PostEntity);
    const qb = postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .leftJoinAndSelect('post.attachments', 'attachments')
      .orderBy('post.createdAt', 'DESC')
      .addOrderBy('attachments.createdAt', 'ASC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    if (status === 'active') {
      qb.andWhere('post.isActive = true');
    }

    if (status === 'deactivated') {
      qb.andWhere('post.isActive = false');
    }

    if (params.community) {
      qb.andWhere('post.community = :community', {
        community: params.community,
      });
    }

    if (q) {
      qb.andWhere(
        `(
          LOWER(post.title) ILIKE :q OR
          LOWER(post.body) ILIKE :q OR
          LOWER(user.first_name) ILIKE :q OR
          LOWER(user.last_name) ILIKE :q OR
          LOWER(user.email_address) ILIKE :q
        )`,
        { q: `%${q.toLowerCase()}%` },
      );
    }

    const [items, totalItems] = await qb.getManyAndCount();
    const [totalPosts, activePosts, deactivatedPosts] = await Promise.all([
      postRepo.count(),
      postRepo.count({ where: { isActive: true } }),
      postRepo.count({ where: { isActive: false } }),
    ]);

    return {
      items,
      totalItems,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
      stats: {
        totalPosts,
        activePosts,
        deactivatedPosts,
      },
    };
  }

  async setPostActiveStatus(postId: number, isActive: boolean) {
    const postRepo = this.dataSource.getRepository(PostEntity);
    const post = await postRepo.findOne({ where: { id: postId } });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    post.isActive = isActive;
    return postRepo.save(post);
  }
}
