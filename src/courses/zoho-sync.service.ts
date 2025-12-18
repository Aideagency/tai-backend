// src/courses/zoho-sync.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
// import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { ZohoService } from './zoho.service';
import { CourseEntity } from 'src/database/entities/course.entity';
import {
  LessonEntity,
  LessonStatus,
  ZohoLessonType,
} from 'src/database/entities/lesson.entity';

@Injectable()
export class ZohoSyncService {
  private logger = new Logger(ZohoSyncService.name);

  constructor(
    private readonly zoho: ZohoService,
    private readonly dataSource: DataSource,
  ) {}

  // every day 2am Lagos time (server timezone must be Africa/Lagos or you set TZ env)
  @Cron('0 2 * * *')
  async syncDaily() {
    await this.syncAllCourses();
  }

  async syncAllCourses() {
    const zohoCourses = await this.zoho.listCourses({view: "all"});
    if (!zohoCourses?.length) return;

    await this.dataSource.transaction(async (manager) => {
      const courseRepo = manager.getRepository(CourseEntity);
      const lessonRepo = manager.getRepository(LessonEntity);

      for (const zc of zohoCourses) {
        const zohoCourseId = String(zc.id);

        const existing = await courseRepo.findOne({
          where: { zoho_course_id: zohoCourseId },
        });

        const course = existing
          ? courseRepo.merge(existing, {
              zoho_course_id: zohoCourseId,
              title: zc.name ?? existing.title,
              description: zc.description ?? existing.description,
              thumbnailUrl:
                zc.bannerThumbUrl ?? zc.thumbnailUrl ?? existing.thumbnailUrl,
              isPublished: zc.status === 'ACTIVE',
            })
          : courseRepo.create({
              zoho_course_id: zohoCourseId,
              title: zc.name ?? null,
              description: zc.description ?? null,
              thumbnailUrl: zc.bannerThumbUrl ?? null,
              isPublished: zc.status === 'ACTIVE',
            });

        const savedCourse = await courseRepo.save(course);

        if (zc.url) {
          const courseData = await this.zoho.getCourseDataByUrl(zc.url);

          const lessonsTree =
            courseData?.DATA?.lessons ||
            courseData?.data?.DATA?.lessons ||
            courseData?.DATA?.LESSONS ||
            [];

          const flat = this.flattenZohoLessons(lessonsTree);
          await this.upsertLessons(lessonRepo, savedCourse.id, flat);
        }
      }
    });

    this.logger.log('Zoho sync completed');
  }

  private flattenZohoLessons(
    nodes: any[],
    parentId: string | null = null,
  ): any[] {
    const out: any[] = [];
    for (const n of nodes || []) {
      out.push({ ...n, _parentId: parentId });
      if (Array.isArray(n.lessons) && n.lessons.length) {
        out.push(...this.flattenZohoLessons(n.lessons, String(n.id)));
      }
    }
    return out;
  }

  private async upsertLessons(
    lessonRepo: Repository<LessonEntity>,
    courseId: number,
    lessons: any[],
  ) {
    // mark all inactive first, then reactivate/upsert present ones
    await lessonRepo
      .createQueryBuilder()
      .update(LessonEntity)
      .set({ status: LessonStatus.INACTIVE })
      .where('course_id = :courseId', { courseId })
      .execute();

    for (const l of lessons) {
      const zohoLessonId = String(l.id);

      const existing = await lessonRepo.findOne({
        where: { course: { id: courseId }, zohoLessonId } as any,
      });

      const zohoModifiedAt = l.modifiedTime
        ? new Date(Number(l.modifiedTime))
        : null;

      const payload: Partial<LessonEntity> = {
        course: { id: courseId } as any,
        zohoLessonId,
        zohoParentId: l.parentId
          ? String(l.parentId)
          : l._parentId
            ? String(l._parentId)
            : null,
        title: l.name,
        slug: l.url ?? null,
        zohoType: l.type as ZohoLessonType,
        status: (l.status as LessonStatus) ?? LessonStatus.ACTIVE,
        sortOrder: Number(l.order ?? 0),
        zohoMeta: l.lessonMeta ?? null,
        zohoModifiedAt,
      };

      const row = existing
        ? lessonRepo.merge(existing, payload)
        : lessonRepo.create(payload);
      await lessonRepo.save(row);
    }
  }
}
