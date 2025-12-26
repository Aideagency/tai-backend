// src/modules/courses/admin-courses.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CloudinaryService } from 'src/infrastructure/cloudinary/cloudinary.service';
import {
  CourseEntity,
  PublishStatus as CoursePublishStatus,
} from 'src/database/entities/course.entity';
import { CourseRepository } from 'src/repository/resourses/course.repository';
import { LessonRepository } from 'src/repository/resourses/lesson.repository';
import { LessonEntity } from 'src/database/entities/lesson.entity';
import {
  AttachmentType,
  LessonAttachmentEntity,
} from 'src/database/entities/lesson-attachment.entity';
import { AdminListCoursesQueryDto } from './dtos/admin-list-courses.query.dto';

// --- you will later move these into dto files; for now keep it simple ---
export type CreateLessonPayload = {
  title: string;
  descriptionHtml?: string | null;
  youtubeUrl?: string | null;
  // optional: allow inserting at position
  sortOrder?: number;
};

export type UpdateLessonPayload = Partial<CreateLessonPayload>;

export type CreateAttachmentPayload = {
  title: string;
  type?: AttachmentType;
};

@Injectable()
export class AdminCoursesService {
  constructor(
    private readonly courseRepo: CourseRepository,
    private readonly lessonRepo: LessonRepository,
    private readonly cloudinary: CloudinaryService,
  ) {}

  // -------------------
  // Courses (your existing admin CRUD - unchanged logic)
  // -------------------
  private async uploadThumbnail(file?: Express.Multer.File) {
    if (!file) return null;
    return this.cloudinary.uploadFile(file, {
      folder: 'courses/thumbnails',
      resourceType: 'image',
    });
  }

  async listCourses(params: AdminListCoursesQueryDto) {
    return this.courseRepo.list(params);
  }

  async createCourse(
    dto: any,
    files?: { thumbnail?: Express.Multer.File[] },
  ): Promise<CourseEntity> {
    const exists = await this.courseRepo.existsByTitle(dto.title);
    if (exists) {
      throw new BadRequestException('A course with this title already exists');
    }

    const thumbFile = files?.thumbnail?.[0];
    const thumb = await this.uploadThumbnail(thumbFile);

    const course = new CourseEntity();
    course.title = dto.title.trim();
    course.descriptionHtml = dto.descriptionHtml ?? null;

    course.thumbnailUrl = thumb?.url ?? null;
    course.thumbnailPublicId = thumb?.publicId ?? null;
    course.thumbnailResourceType = thumb ? 'image' : null;

    course.isFree = dto.isFree ?? true;
    course.price = course.isFree ? null : (dto.price ?? null);
    course.currency = dto.currency ?? 'NGN';
    course.status = dto.status ?? CoursePublishStatus.DRAFT;

    if (!course.isFree && (!course.price || Number(course.price) <= 0)) {
      throw new BadRequestException('price is required for paid courses');
    }

    return this.courseRepo.save(course);
  }

  async updateCourse(
    id: number,
    dto: any,
    files?: { thumbnail?: Express.Multer.File[] },
  ): Promise<CourseEntity> {
    const course = await this.courseRepo.findOne({ id });
    if (!course) throw new NotFoundException('Course not found');

    if (dto.title && dto.title.trim() !== course.title) {
      const exists = await this.courseRepo.existsByTitle(dto.title, id);
      if (exists) {
        throw new BadRequestException(
          'A course with this title already exists',
        );
      }
    }

    const thumbFile = files?.thumbnail?.[0];
    if (thumbFile) {
      if (course.thumbnailPublicId) {
        await this.cloudinary.deleteFile(course.thumbnailPublicId, 'image');
      }
      const thumb = await this.uploadThumbnail(thumbFile);

      course.thumbnailUrl = thumb?.url ?? null;
      course.thumbnailPublicId = thumb?.publicId ?? null;
      course.thumbnailResourceType = thumb ? 'image' : null;
    }

    if (dto.title !== undefined) course.title = dto.title.trim();
    if (dto.descriptionHtml !== undefined)
      course.descriptionHtml = dto.descriptionHtml ?? null;

    if (dto.currency !== undefined) course.currency = dto.currency;
    if (dto.status !== undefined) course.status = dto.status;

    if (dto.isFree !== undefined) {
      course.isFree = dto.isFree;
      if (dto.isFree === true) course.price = null;
    }

    if (dto.price !== undefined) course.price = dto.price ?? null;

    if (
      course.isFree === false &&
      (!course.price || Number(course.price) <= 0)
    ) {
      throw new BadRequestException('price is required for paid courses');
    }

    return this.courseRepo.save(course);
  }

  async getCourse(id: number) {
    const course = await this.courseRepo.findOne({ id });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  async deleteCourse(id: number) {
    const course = await this.courseRepo.findOne({ id });
    if (!course) throw new NotFoundException('Course not found');

    if (course.thumbnailPublicId) {
      await this.cloudinary.deleteFile(course.thumbnailPublicId, 'image');
    }

    await this.courseRepo.softDelete(id);
    return { message: 'Course deleted successfully' };
  }

  // -------------------
  // Lessons (ADMIN: add/manage/order)
  // -------------------

  private validateLessonPayload(dto: Partial<CreateLessonPayload>) {
    if (dto.title !== undefined && !dto.title?.trim()) {
      throw new BadRequestException('Lesson title cannot be empty');
    }
    if (dto.youtubeUrl !== undefined && dto.youtubeUrl !== null) {
      const v = dto.youtubeUrl.trim();
      if (v.length > 0 && !v.startsWith('http')) {
        throw new BadRequestException('youtubeUrl must be a valid URL');
      }
    }
    if (dto.sortOrder !== undefined && Number(dto.sortOrder) < 1) {
      throw new BadRequestException('sortOrder must be >= 1');
    }
  }

  async addLessonToCourse(courseId: number, dto: CreateLessonPayload) {
    this.validateLessonPayload(dto);

    const course = await this.courseRepo.findOne({ id: courseId });
    if (!course) throw new NotFoundException('Course not found');

    // If sortOrder is provided, create a gap. Otherwise append to end.
    const sortOrder = dto.sortOrder
      ? Number(dto.sortOrder)
      : await this.lessonRepo.getNextSortOrder(courseId);

    if (dto.sortOrder) {
      await this.lessonRepo.bumpSortOrders(courseId, sortOrder);
    }

    const lesson: Partial<LessonEntity> = {
      courseId,
      title: dto.title.trim(),
      descriptionHtml: dto.descriptionHtml ?? null,
      youtubeUrl: dto.youtubeUrl?.trim() || null,
      sortOrder,
    };

    return this.lessonRepo.createLesson(lesson);
  }

  async updateCourseLesson(
    courseId: number,
    lessonId: number,
    dto: UpdateLessonPayload,
  ) {
    this.validateLessonPayload(dto);

    const course = await this.courseRepo.findOne({ id: courseId });
    if (!course) throw new NotFoundException('Course not found');

    const existing = await this.lessonRepo.getLessonById(lessonId);
    if (!existing || existing.courseId !== courseId) {
      throw new NotFoundException('Lesson not found for this course');
    }

    // If moving sortOrder, use moveLesson for coherence
    if (dto.sortOrder !== undefined && dto.sortOrder !== existing.sortOrder) {
      const moved = await this.lessonRepo.moveLesson(
        courseId,
        lessonId,
        Number(dto.sortOrder),
      );
      if (!moved) throw new NotFoundException('Lesson not found');
    }

    // Update other fields
    const payload: Partial<LessonEntity> = {
      ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
      ...(dto.descriptionHtml !== undefined
        ? { descriptionHtml: dto.descriptionHtml ?? null }
        : {}),
      ...(dto.youtubeUrl !== undefined
        ? { youtubeUrl: dto.youtubeUrl?.trim() || null }
        : {}),
    };

    const updated = await this.lessonRepo.updateLesson(lessonId, payload);
    if (!updated) throw new NotFoundException('Lesson not found');

    return updated;
  }

  async deleteCourseLesson(courseId: number, lessonId: number) {
    const course = await this.courseRepo.findOne({ id: courseId });
    if (!course) throw new NotFoundException('Course not found');

    const existing = await this.lessonRepo.getLessonById(lessonId);
    if (!existing || existing.courseId !== courseId) {
      throw new NotFoundException('Lesson not found for this course');
    }

    await this.lessonRepo.deleteLesson(lessonId);
    return { message: 'Lesson deleted successfully' };
  }

  async reorderCourseLesson(
    courseId: number,
    lessonId: number,
    toOrder: number,
  ) {
    const course = await this.courseRepo.findOne({ id: courseId });
    if (!course) throw new NotFoundException('Course not found');

    if (!toOrder || Number(toOrder) < 1) {
      throw new BadRequestException('toOrder must be >= 1');
    }

    const moved = await this.lessonRepo.moveLesson(
      courseId,
      lessonId,
      Number(toOrder),
    );
    if (!moved) throw new NotFoundException('Lesson not found');

    return moved;
  }

  async listCourseLessonsAdmin(courseId: number) {
    const course = await this.courseRepo.findOne({ id: courseId });
    if (!course) throw new NotFoundException('Course not found');

    return this.lessonRepo.listLessonsByCourse(courseId);
  }

  async getCourseFullAdmin(courseId: number) {
    const course = await this.courseRepo.findOne({ id: courseId });
    if (!course) throw new NotFoundException('Course not found');

    const { lessons, stats } =
      await this.lessonRepo.getCourseLessonsWithStats(courseId);

    return {
      course,
      lessons,
      stats,
    };
  }

  // -------------------
  // Lesson Attachments (ADMIN)
  // -------------------

  private async uploadLessonAttachment(file: Express.Multer.File) {
    // PDFs/docs/images can all go to Cloudinary;
    // choose resourceType based on file mimetype if you want.
    const isImage = file.mimetype?.startsWith('image/');
    return this.cloudinary.uploadFile(file, {
      folder: 'courses/lesson-attachments',
      resourceType: isImage ? 'image' : 'raw',
    });
  }

  async addLessonAttachment(
    courseId: number,
    lessonId: number,
    dto: CreateAttachmentPayload,
    file?: Express.Multer.File,
  ) {
    if (!dto?.title?.trim()) throw new BadRequestException('title is required');
    if (!file) throw new BadRequestException('attachment file is required');

    const course = await this.courseRepo.findOne({ id: courseId });
    if (!course) throw new NotFoundException('Course not found');

    const lesson = await this.lessonRepo.getLessonById(lessonId);
    if (!lesson || lesson.courseId !== courseId) {
      throw new NotFoundException('Lesson not found for this course');
    }

    const uploaded = await this.uploadLessonAttachment(file);

    const att: Partial<LessonAttachmentEntity> = {
      lessonId,
      title: dto.title.trim(),
      type: dto.type ?? AttachmentType.OTHER,
      url: uploaded.url,
      publicId: uploaded.publicId ?? null,
      resourceType:
        (uploaded.resourceType as any) ??
        (file.mimetype?.startsWith('image/') ? 'image' : 'raw'),
      sizeBytes: file.size ?? null,
    };

    return this.lessonRepo.addAttachment(att);
  }

  async removeLessonAttachment(
    courseId: number,
    lessonId: number,
    attachmentId: number,
  ) {
    const course = await this.courseRepo.findOne({ id: courseId });
    if (!course) throw new NotFoundException('Course not found');

    const lesson = await this.lessonRepo.getLessonById(lessonId);
    if (!lesson || lesson.courseId !== courseId) {
      throw new NotFoundException('Lesson not found for this course');
    }

    const att = await this.lessonRepo.getAttachmentById(attachmentId);
    if (!att || att.lessonId !== lessonId) {
      throw new NotFoundException('Attachment not found for this lesson');
    }

    if (att.publicId) {
      await this.cloudinary.deleteFile(
        att.publicId,
        att.resourceType === 'image' ? 'image' : 'raw',
      );
    }

    await this.lessonRepo.deleteAttachment(attachmentId);
    return { message: 'Attachment removed successfully' };
  }
}
