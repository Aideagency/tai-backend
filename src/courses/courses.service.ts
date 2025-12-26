// src/modules/courses/courses.service.ts
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AccessKind,
  AccessStatus,
} from 'src/database/entities/course-access.entity';
import {
  CourseEntity,
  PublishStatus as CoursePublishStatus,
} from 'src/database/entities/course.entity';
import {
  PaidFor,
  TransactionEntity,
} from 'src/database/entities/transaction.entity';
import { EmailService } from 'src/infrastructure/communication/email/email.service';
import { TracerLogger } from 'src/logger/logger.service';
import { PaymentService } from 'src/payment/payment.service';
import { CourseAccessRepository } from 'src/repository/resourses/course-access.repository';
import {
  CourseRepository,
  CourseListFilters,
} from 'src/repository/resourses/course.repository';
import { LessonRepository } from 'src/repository/resourses/lesson.repository';
import { TransactionRepository } from 'src/repository/transaction/transaction.repository';

export type CreateCoursePayload = {
  title: string;
  descriptionHtml?: string | null;
  thumbnailUrl?: string | null;
  thumbnailPublicId?: string | null;
  thumbnailResourceType?: string | null;
  isFree?: boolean;
  price?: number | null;
  currency?: string;
  status?: CoursePublishStatus;
};

export type UpdateCoursePayload = Partial<CreateCoursePayload>;

@Injectable()
export class CoursesService {
  constructor(
    private readonly courseRepo: CourseRepository,
    private readonly lessonRepo: LessonRepository,
    private readonly courseAccessRepo: CourseAccessRepository,
    @Inject(forwardRef(() => PaymentService))
    private readonly paymentService: PaymentService,
    private readonly transactionRepo: TransactionRepository,
    private readonly emailService: EmailService,
    private readonly logger: TracerLogger,
  ) {}

  // -------------------
  // Courses (existing)
  // -------------------
  async create(payload: CreateCoursePayload): Promise<CourseEntity> {
    if (!payload?.title?.trim()) {
      throw new BadRequestException('title is required');
    }

    const exists = await this.courseRepo.existsByTitle(payload.title);
    if (exists) {
      throw new BadRequestException('A course with this title already exists');
    }

    const isFree = payload.isFree ?? true;

    const normalized: Partial<CourseEntity> = {
      title: payload.title.trim(),
      descriptionHtml: payload.descriptionHtml ?? null,
      thumbnailUrl: payload.thumbnailUrl ?? null,
      thumbnailPublicId: payload.thumbnailPublicId ?? null,
      thumbnailResourceType: payload.thumbnailResourceType ?? null,
      isFree,
      price: isFree ? null : (payload.price ?? null),
      currency: payload.currency ?? 'NGN',
      status: payload.status ?? CoursePublishStatus.DRAFT,
    };

    if (!isFree && (!normalized.price || Number(normalized.price) <= 0)) {
      throw new BadRequestException('price is required for paid courses');
    }

    return this.courseRepo.createCourse(normalized);
  }

  async update(
    id: number,
    payload: UpdateCoursePayload,
  ): Promise<CourseEntity> {
    if (!id || id < 1) throw new BadRequestException('Invalid course id');

    const existing = await this.findOne(id);

    if (payload.title && payload.title.trim() !== existing.title) {
      const exists = await this.courseRepo.existsByTitle(payload.title, id);
      if (exists) {
        throw new BadRequestException(
          'A course with this title already exists',
        );
      }
    }

    const nextIsFree = payload.isFree ?? existing.isFree;
    const nextPrice =
      payload.price !== undefined ? payload.price : existing.price;

    if (!nextIsFree && (!nextPrice || Number(nextPrice) <= 0)) {
      throw new BadRequestException('price is required for paid courses');
    }

    const normalized: Partial<CourseEntity> = {
      ...(payload.title !== undefined ? { title: payload.title.trim() } : {}),
      ...(payload.descriptionHtml !== undefined
        ? { descriptionHtml: payload.descriptionHtml ?? null }
        : {}),
      ...(payload.thumbnailUrl !== undefined
        ? { thumbnailUrl: payload.thumbnailUrl ?? null }
        : {}),
      ...(payload.thumbnailPublicId !== undefined
        ? { thumbnailPublicId: payload.thumbnailPublicId ?? null }
        : {}),
      ...(payload.thumbnailResourceType !== undefined
        ? { thumbnailResourceType: payload.thumbnailResourceType ?? null }
        : {}),
      ...(payload.currency !== undefined ? { currency: payload.currency } : {}),
      ...(payload.status !== undefined ? { status: payload.status } : {}),
      ...(payload.isFree !== undefined ? { isFree: payload.isFree } : {}),
      ...(payload.price !== undefined ? { price: payload.price } : {}),
    };

    if (payload.isFree === true) {
      normalized.price = null;
    }

    return this.courseRepo.updateCourse(id, normalized);
  }

  async findOne(id: number): Promise<CourseEntity> {
    try {
      return await this.courseRepo.getById(id);
    } catch {
      throw new NotFoundException('Course not found');
    }
  }

  async list(userId: number, filters: CourseListFilters) {
    return this.courseRepo.listForUser(userId, filters);
  }

  async remove(id: number): Promise<{ message: string }> {
    await this.findOne(id);
    await this.courseRepo.deleteById(id);
    return { message: 'Course deleted successfully' };
  }

  // -------------------
  // Lessons (public read)
  // -------------------
  async listCourseLessons(courseId: number) {
    await this.findOne(courseId); // ensure course exists
    return this.lessonRepo.listLessonsByCourse(courseId);
  }

  async enroll(req: any, courseId: number) {
    const userId = req.user.id;
    const email = req.user.email ?? req.user.email_address;

    if (!userId) throw new BadRequestException('Invalid user');
    if (!courseId || courseId < 1)
      throw new BadRequestException('Invalid course id');

    const course = await this.findOne(courseId);

    // Optional: don't allow enrollment into non-published courses
    if (course.status !== CoursePublishStatus.PUBLISHED) {
      throw new BadRequestException('Course is not available for enrollment');
    }

    // Already has valid access?
    const hasAccess = await this.courseAccessRepo.hasActiveAccess(
      userId,
      courseId,
    );
    if (hasAccess) {
      throw new BadRequestException('You are already enrolled in this course');
    }

    // FREE enrollment
    if (course.isFree || !course.price || Number(course.price) <= 0) {
      const access = await this.courseAccessRepo.upsertAccess({
        userId,
        courseId,
        kind: AccessKind.FREE,
        status: AccessStatus.ACTIVE,
        startsAt: new Date(),
        endsAt: null,
        provider: null,
        providerRef: null,
      });

      return {
        message: 'Enrollment successful',
        data: {
          courseId,
          accessId: access.id,
          status: access.status,
        },
      };
    }

    // PAID enrollment: init payment
    const koboAmount = Math.round(Number(course.price) * 100);

    const paymentResponse = await this.paymentService.initializePayment({
      email,
      amount: String(koboAmount),
    });

    // Create transaction record (same pattern as Event)
    const tx = new TransactionEntity();
    tx.transaction_ref = paymentResponse.reference;
    tx.email_address = email;
    tx.paid_for = PaidFor.COURSE; // ✅ add this enum option if not present
    tx.actualAmount = Number(course.price);
    // If your transaction table supports these fields, store them too:
    // tx.courseId = courseId;
    // tx.userId = userId;
    await this.transactionRepo.save(tx);

    // Create PENDING course access linked to payment reference
    await this.courseAccessRepo.upsertAccess({
      userId,
      courseId,
      kind: AccessKind.ONE_TIME,
      status: AccessStatus.PENDING,
      provider: 'paystack',
      providerRef: paymentResponse.reference,
      startsAt: new Date(),
      endsAt: null,
    });

    return {
      message: 'Payment initiated',
      data: {
        authorization_url: paymentResponse.authorization_url,
        reference: paymentResponse.reference,
        courseId,
      },
    };
  }

  // async confirmCoursePayment(ref: string) {
  //   const access = await this.courseAccessRepo.findByProviderRef(
  //     'paystack',
  //     ref,
  //   );
  //   if (!access) return;

  //   access.status = AccessStatus.ACTIVE;
  //   if (!access.startsAt) access.startsAt = new Date();

  //   await this.courseAccessRepo.save(access);

  //   return { message: 'Course access activated' };
  // }

  /**
   * Full course view: course info + lessons + attachments + stats
   * (Access control comes later)
   */
  async getCourseContent(courseId: number) {
    const course = await this.findOne(courseId);
    const { lessons, stats } =
      await this.lessonRepo.getCourseLessonsWithStats(courseId);

    return {
      course,
      lessons,
      stats,
    };
  }

  async handlePaymentConfirmation(ref: string, email: string) {
    const accessDetails =
      await this.courseAccessRepo.findByProviderRefWithUserAndCourseSafe({
        providerRef: ref,
      });
    if (accessDetails) {
      accessDetails.status = AccessStatus.ACTIVE;
      await this.courseAccessRepo.save(accessDetails);

      this.emailService
        .sendMail({
          to: email,
          subject: 'Enrollment Successful',
          template: 'course-enrollment',
          data: {
            username: accessDetails.user.first_name,
            course_title: accessDetails.course.title,
            course_description: accessDetails.course.descriptionHtml,
            isPaid: accessDetails.course.isFree,
            price: accessDetails.course.price,
            access_kind: accessDetails.kind,
            starts_at: accessDetails.startsAt,
            ends_at: accessDetails.endsAt,
          },
        })
        .then((res) => {
          this.logger.log(res);
        })
        .catch((err) => this.logger.error(err));
    }
  }
}
