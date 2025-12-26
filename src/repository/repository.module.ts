import { Module } from '@nestjs/common';
import { UserRepository } from './user/user.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/database/entities/user.entity';
import { TransactionEntity } from 'src/database/entities/transaction.entity';
import { TransactionRepository } from './transaction/transaction.repository';
import { AdminEntity } from 'src/database/entities/admin.entity';
import { AdminRepository } from './admin/admin.repository';
import { NuggetEntity } from 'src/database/entities/nugget.entity';
import { NuggetCommentEntity } from 'src/database/entities/nugget-comment.entity';
import { NuggetLikeEntity } from 'src/database/entities/nugget-like.entity';
import { NuggetRepository } from './nuggets/nugget.repository';
import { PrayerAmenEntity } from 'src/database/entities/prayer-amen.entity';
import { PrayerCommentEntity } from 'src/database/entities/prayer-comment.entity';
import { PrayerWallEntity } from 'src/database/entities/prayer-wall.entity';
import { PrayerWallRepository } from './prayer/prayer-wall.repository';
import { ChallengeEntity } from 'src/database/entities/challenge.entity';
import { BadgeEntity } from 'src/database/entities/badge.entity';
import { ChallengeRepository } from './challenge/challenge.repository';
import { UserChallengesRepository } from './challenge/user-challenge.repository';
import { UserTaskProgressRepository } from './challenge/user-task-progress.repository';
import { UserBadgeEntity } from 'src/database/entities/user-badge.entity';
import { UserTaskProgressEntity } from 'src/database/entities/user-task-progress.entity';
import { ChallengeTaskEntity } from 'src/database/entities/challenge-task.entity';
import { ChallengeReflectionEntity } from 'src/database/entities/challenge-reflection.entity';
import { UserChallengeEntity } from 'src/database/entities/user-challenge.entity';
import { ChallengeTaskRepository } from './challenge/challenge-task.repository';
import { FollowRepository } from './connection/follow.repository';
import { FollowEntity } from 'src/database/entities/follow.entity';
import { PostRepository } from './post/post.repository';
import { PostEntity } from 'src/database/entities/post.entity';
import { PostLikeEntity } from 'src/database/entities/post-like.entity';
import { PostCommentEntity } from 'src/database/entities/post-comment.entity';
import { PostShareEntity } from 'src/database/entities/post-share.entity';
import { EventRegistrationEntity } from 'src/database/entities/event-registration.entity';
import { EventRepository } from './event/event.repository';
import { EventRegistrationRepository } from './event/event-registration.repository';
import { EventEntity } from 'src/database/entities/event.entity';
import { CounsellingEntity } from 'src/database/entities/counselling.entity';
import { CounsellingBookingEntity } from 'src/database/entities/counselling-booking.entity';
import { CounsellingBookingRepository } from './counselling/counselling-booking.repostiory';
import { CounsellingRepository } from './counselling/counselling.repostiory';
import { RefundRequestRepository } from './refund/refund-request.repository';
import { RefundRequestEntity } from 'src/database/entities/refund-request.entity';
import { CourseEntity } from 'src/database/entities/course.entity';
import { UserLessonProgressEntity } from 'src/database/entities/user-lesson-progress.entity';
// import { UserCourseProgressEntity } from 'src/database/entities/user-course-progress.entity';
import { LessonEntity } from 'src/database/entities/lesson.entity';
import { CourseRepository } from './resourses/course.repository';
import { UserCourseProgressRepository } from './resourses/user-course-progress.repository';
import { UserLessonProgressRepository } from './resourses/user-lesson-progress.repository';
import { LessonRepository } from './resourses/lesson.repository';
import { BookRepository } from './book/book.repository';
import { BookEntity } from 'src/database/entities/book.entity';
import { UserBookDownloadEntity } from 'src/database/entities/user-book-download.entity';
// import { UserSectionProgressRepository } from './resourses/user-section-progress.repository';
import { UserSectionProgressEntity } from 'src/database/entities/user-section-progress.entity';
import { CourseAccessRepository } from './resourses/course-access.repository';
import { CourseAccessEntity } from 'src/database/entities/course-access.entity';
import { LessonSectionRepository } from './resourses/lesson-section.repository';
import { SectionAttachmentRepository } from './resourses/section-attachment.repository';
import { SectionAttachmentEntity } from 'src/database/entities/section-attachment.entity';
import { LessonAttachmentEntity } from 'src/database/entities/lesson-attachment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      TransactionEntity,
      AdminEntity,
      NuggetEntity,
      NuggetCommentEntity,
      NuggetLikeEntity,
      PrayerWallEntity,
      PrayerCommentEntity,
      PrayerAmenEntity,
      ChallengeEntity,
      BadgeEntity,
      ChallengeReflectionEntity,
      ChallengeTaskEntity,
      UserBadgeEntity,
      UserTaskProgressEntity,
      UserChallengeEntity,
      FollowEntity,
      PostEntity,
      PostLikeEntity,
      PostCommentEntity,
      PostShareEntity,
      EventEntity,
      EventRegistrationEntity,
      CounsellingEntity,
      CounsellingBookingEntity,
      RefundRequestEntity,
      CourseEntity,
      // UserLessonProgressEntity,
      // UserCourseProgressEntity,
      LessonEntity,
      LessonAttachmentEntity,
      BookEntity,
      UserBookDownloadEntity,
      // UserSectionProgressEntity,
      // LessonSectionEntity,
      CourseAccessEntity,
      // SectionAttachmentEntity,
    ]),
  ],
  providers: [
    UserRepository,
    TransactionRepository,
    AdminRepository,
    NuggetRepository,
    PrayerWallRepository,
    ChallengeRepository,
    UserChallengesRepository,
    UserTaskProgressRepository,
    ChallengeTaskRepository,
    FollowRepository,
    PostRepository,
    EventRegistrationRepository,
    EventRepository,
    CounsellingRepository,
    CounsellingBookingRepository,
    RefundRequestRepository,
    LessonRepository,
    CourseRepository,
    BookRepository,
    // UserCourseProgressRepository,
    // UserLessonProgressRepository,
    // UserSectionProgressRepository,
    CourseAccessRepository,
    // LessonSectionRepository,
    // SectionAttachmentRepository,
  ],
  exports: [
    UserRepository,
    TransactionRepository,
    AdminRepository,
    NuggetRepository,
    PrayerWallRepository,
    ChallengeRepository,
    UserChallengesRepository,
    UserTaskProgressRepository,
    ChallengeTaskRepository,
    FollowRepository,
    PostRepository,
    EventRegistrationRepository,
    EventRepository,
    CounsellingRepository,
    CounsellingBookingRepository,
    RefundRequestRepository,
    LessonRepository,
    // UserLessonProgressRepository,
    // UserCourseProgressRepository,
    CourseRepository,
    BookRepository,
    // UserSectionProgressRepository,
    CourseAccessRepository,
    // LessonSectionRepository,
    // SectionAttachmentRepository,
  ],
})
export class RepositoryModule {}
