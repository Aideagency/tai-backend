// src/courses/courses.service.ts
import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
// import { CourseRepository } from 'src/repository/courses/course.repository';
// import { LessonRepository } from 'src/repository/courses/lesson.repository';
// import { UserCourseProgressRepository } from 'src/repository/courses/user-course-progress.repository';
// import { UserLessonProgressRepository } from 'src/repository/courses/user-lesson-progress.repository';
// import { UserSubscriptionRepository } from 'src/repository/courses/user-subscription.repository';
import { CourseAccessType } from 'src/database/entities/course.entity';
import { LessonProgressStatus } from 'src/database/entities/user-lesson-progress.entity';
import { CourseRepository } from 'src/repository/resourses/course.repository';
import { LessonRepository } from 'src/repository/resourses/lesson.repository';
import { UserCourseProgressRepository } from 'src/repository/resourses/user-course-progress.repository';
import { UserLessonProgressRepository } from 'src/repository/resourses/user-lesson-progress.repository';
import { UserSubscriptionRepository } from 'src/repository/resourses/user-subscription.repository';

@Injectable()
export class CoursesService {
  constructor(
    private readonly coursesRepo: CourseRepository,
    private readonly lessonsRepo: LessonRepository,
    private readonly userCourseRepo: UserCourseProgressRepository,
    private readonly userLessonRepo: UserLessonProgressRepository,
    private readonly subsRepo: UserSubscriptionRepository,
  ) {}

  async listCourses(params: any) {
    return this.coursesRepo.listPaginated({ publishedOnly: true, ...params });
  }

  async getCourseById(courseId: number) {
    const course = await this.coursesRepo.findOne({ id: courseId });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  async getCourseOutline(courseId: number) {
    const course = await this.getCourseById(courseId);
    const lessons = await this.lessonsRepo.listActiveForCourse(String(course.id));
    return { course, lessons };
  }

  private async assertUserCanAccessCourse(userId: number, courseId: number) {
    const course = await this.getCourseById(courseId);

    if (course.accessType === CourseAccessType.FREE) return course;

    const ok = await this.subsRepo.hasActiveSubscription(userId, courseId);
    if (!ok)
      throw new ForbiddenException('You do not have access to this course');

    return course;
  }

  async enroll(userId: number, courseId: number) {
    await this.assertUserCanAccessCourse(userId, courseId);
    return this.userCourseRepo.enrollIfNotExists(userId, courseId);
  }

  async getMyCourseProgress(userId: number, courseId: number) {
    await this.assertUserCanAccessCourse(userId, courseId);
    const progress = await this.userCourseRepo.getForUserCourse(
      userId,
      courseId,
    );
    return progress
      ? { enrolled: true, progress }
      : { enrolled: false, progress: null };
  }

  async openLesson(userId: number, courseId: number, lessonId: number) {
    await this.assertUserCanAccessCourse(userId, courseId);

    const courseProgress = await this.userCourseRepo.enrollIfNotExists(
      userId,
      courseId,
    );
    await this.userCourseRepo.touchLastAccess(userId, courseId);

    await this.userLessonRepo.upsertProgress({
      userId: String(userId),
      courseProgressId: String(courseProgress.id),
      lessonId: String(lessonId),
      status: LessonProgressStatus.IN_PROGRESS,
    });

    const lesson = await this.lessonsRepo.findOne({ id: lessonId });
    if (!lesson) throw new NotFoundException('Lesson not found');

    return { lesson, courseProgressId: courseProgress.id };
  }

  async updateLessonProgress(
    userId: number,
    courseId: number,
    lessonId: number,
    body: { status?: LessonProgressStatus; progressPercent?: number },
  ) {
    await this.assertUserCanAccessCourse(userId, courseId);

    const courseProgress = await this.userCourseRepo.enrollIfNotExists(
      userId,
      courseId,
    );

    return this.userLessonRepo.upsertProgress({
      userId: String(userId),
      courseProgressId: String(courseProgress.id),
      lessonId: String(lessonId),
      status: body.status,
      progressPercent: body.progressPercent,
    });
  }
}
