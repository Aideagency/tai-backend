// src/repository/resources/lesson.repository.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LessonEntity } from 'src/database/entities/lesson.entity';
import { LessonAttachmentEntity } from 'src/database/entities/lesson-attachment.entity';

@Injectable()
export class LessonRepository {
  protected logger = new Logger(LessonRepository.name);

  constructor(
    @InjectRepository(LessonEntity)
    private readonly repo: Repository<LessonEntity>,
    @InjectRepository(LessonAttachmentEntity)
    private readonly attRepo: Repository<LessonAttachmentEntity>,
  ) {}

  // ---------- basics ----------
  async getLessonById(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  async listLessonsByCourse(courseId: number) {
    return this.repo.find({
      where: { courseId },
      order: { sortOrder: 'ASC', id: 'ASC' },
      relations: { attachments: true },
    });
  }

  async getNextSortOrder(courseId: number) {
    const row = await this.repo
      .createQueryBuilder('l')
      .select('COALESCE(MAX(l.sortOrder), 0)', 'max')
      .where('l.courseId = :courseId', { courseId })
      .getRawOne<{ max: string }>();

    const max = Number(row?.max ?? 0);
    return max + 1;
  }

  async createLesson(payload: Partial<LessonEntity>) {
    const entity = this.repo.create(payload);
    return this.repo.save(entity);
  }

  async updateLesson(id: number, payload: Partial<LessonEntity>) {
    await this.repo.update({ id }, payload);
    return this.getLessonById(id);
  }

  async deleteLesson(id: number) {
    await this.repo.delete({ id });
  }

  // ---------- ordering helpers ----------
  /**
   * Shift sortOrder by +1 for lessons in a course where sortOrder >= fromOrder
   * This creates space to insert at a specific position.
   */
  async bumpSortOrders(courseId: number, fromOrder: number) {
    await this.repo
      .createQueryBuilder()
      .update(LessonEntity)
      .set({ sortOrder: () => `"sortOrder" + 1` })
      .where(`"courseId" = :courseId`, { courseId })
      .andWhere(`"sortOrder" >= :fromOrder`, { fromOrder })
      .execute();
  }

  /**
   * Moves a lesson to a new sortOrder while keeping ordering coherent.
   * Uses a safe "gap" trick to avoid unique index collisions.
   */
  async moveLesson(courseId: number, lessonId: number, toOrder: number) {
    const lesson = await this.repo.findOne({
      where: { id: lessonId, courseId },
    });
    if (!lesson) return null;

    const fromOrder = lesson.sortOrder;

    if (toOrder === fromOrder) return lesson;

    // Temporarily move lesson out of the way (big number avoids collisions)
    await this.repo.update({ id: lessonId }, { sortOrder: 9999999 });

    if (toOrder > fromOrder) {
      // shift down lessons between (fromOrder, toOrder]
      await this.repo
        .createQueryBuilder()
        .update(LessonEntity)
        .set({ sortOrder: () => `"sortOrder" - 1` })
        .where({ courseId }) 
        .andWhere(`"sortOrder" > :fromOrder`, { fromOrder })
        .andWhere(`"sortOrder" <= :toOrder`, { toOrder })
        .execute();
    } else {
      // shift up lessons between [toOrder, fromOrder)
      await this.repo
        .createQueryBuilder()
        .update(LessonEntity)
        .set({ sortOrder: () => `"sortOrder" + 1` })
        .where({ courseId }) 
        .andWhere(`"sortOrder" >= :toOrder`, { toOrder })
        .andWhere(`"sortOrder" < :fromOrder`, { fromOrder })
        .execute();
    }

    // Place lesson at new order
    await this.repo.update({ id: lessonId }, { sortOrder: toOrder });

    return this.repo.findOne({
      where: { id: lessonId },
      relations: { attachments: true },
    });
  }

  // ---------- full course view (course + lessons + attachments + stats) ----------
  // This assumes you’ll call CourseRepository.getById separately to validate the course.
  async getCourseLessonsWithStats(courseId: number) {
    const lessons = await this.repo.find({
      where: { courseId },
      order: { sortOrder: 'ASC', id: 'ASC' },
      relations: { attachments: true },
    });

    const totalLessons = lessons.length;
    const totalAttachments = lessons.reduce(
      (sum, l) => sum + (l.attachments?.length ?? 0),
      0,
    );

    return {
      lessons,
      stats: {
        totalLessons,
        totalAttachments,
      },
    };
  }

  // ---------- attachments ----------
  async addAttachment(payload: Partial<LessonAttachmentEntity>) {
    const entity = this.attRepo.create(payload);
    return this.attRepo.save(entity);
  }

  async getAttachmentById(id: number) {
    return this.attRepo.findOne({ where: { id } });
  }

  async deleteAttachment(id: number) {
    await this.attRepo.delete({ id });
  }
}
