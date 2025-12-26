// // src/repository/courses/user-section-progress.repository.ts
// import { Injectable, Logger, NotFoundException } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { DataSource, Repository } from 'typeorm';
// import { BaseRepository } from '../base.repository';
// import {
//   UserSectionProgressEntity,
//   ProgressState,
// } from 'src/database/entities/user-section-progress.entity';
// import { LessonSectionEntity } from 'src/database/entities/lesson-section.entity';
// import {
//   UserCourseProgressEntity,
//   CourseStatus,
// } from 'src/database/entities/user-course-progress.entity';

// @Injectable()
// export class UserSectionProgressRepository extends BaseRepository<
//   UserSectionProgressEntity,
//   Repository<UserSectionProgressEntity>
// > {
//   protected logger = new Logger(UserSectionProgressRepository.name);

//   constructor(
//     @InjectRepository(UserSectionProgressEntity)
//     repo: Repository<UserSectionProgressEntity>,
//     @InjectRepository(LessonSectionEntity)
//     private readonly sectionRepo: Repository<LessonSectionEntity>,
//     @InjectRepository(UserCourseProgressEntity)
//     private readonly courseProgRepo: Repository<UserCourseProgressEntity>,
//     private readonly dataSource: DataSource,
//   ) {
//     super(repo);
//   }

//   async upsertProgress(args: {
//     userId: number;
//     courseProgressId: number;
//     sectionId: number;

//     // manual completion
//     manuallyCompleted?: boolean;

//     // auto tracking
//     lastPositionSeconds?: number;
//     totalWatchedSeconds?: number;

//     // explicit status override if you want to set it directly
//     status?: ProgressState;
//   }) {
//     const section = await this.sectionRepo.findOne({
//       where: { id: args.sectionId },
//     });
//     if (!section) throw new NotFoundException('Section not found');

//     return this.dataSource.transaction(async (manager) => {
//       const existing = await manager.findOne(UserSectionProgressEntity, {
//         where: { userId: args.userId, sectionId: args.sectionId } as any,
//       });

//       const now = new Date();

//       const nextStatus =
//         args.status ??
//         (args.manuallyCompleted ? ProgressState.COMPLETED : undefined) ??
//         existing?.status ??
//         ProgressState.IN_PROGRESS;

//       const row = existing
//         ? manager.merge(UserSectionProgressEntity, existing, {
//             status: nextStatus,
//             startedAt: existing.startedAt ?? now,
//             completedAt:
//               nextStatus === ProgressState.COMPLETED
//                 ? (existing.completedAt ?? now)
//                 : existing.completedAt,
//             manuallyCompleted:
//               typeof args.manuallyCompleted === 'boolean'
//                 ? args.manuallyCompleted
//                 : existing.manuallyCompleted,
//             lastPositionSeconds:
//               typeof args.lastPositionSeconds === 'number'
//                 ? args.lastPositionSeconds
//                 : existing.lastPositionSeconds,
//             totalWatchedSeconds:
//               typeof args.totalWatchedSeconds === 'number'
//                 ? args.totalWatchedSeconds
//                 : existing.totalWatchedSeconds,
//           })
//         : manager.create(UserSectionProgressEntity, {
//             userId: args.userId,
//             sectionId: args.sectionId,
//             status: nextStatus,
//             startedAt: now,
//             completedAt: nextStatus === ProgressState.COMPLETED ? now : null,
//             manuallyCompleted: args.manuallyCompleted ?? false,
//             lastPositionSeconds: args.lastPositionSeconds ?? null,
//             totalWatchedSeconds: args.totalWatchedSeconds ?? null,
//           });

//       const saved = await manager.save(UserSectionProgressEntity, row);

//       // OPTIONAL: update cached course progress (if you still keep it)
//       // This assumes courseProgressId belongs to a specific course and user.
//       const all = await manager.count(UserSectionProgressEntity, {
//         where: { userId: args.userId } as any,
//       });

//       const done = await manager.count(UserSectionProgressEntity, {
//         where: {
//           userId: args.userId,
//           status: ProgressState.COMPLETED,
//         } as any,
//       });

//       const pct = all ? Math.round((done / all) * 100) : 0;

//       await manager.update(
//         UserCourseProgressEntity,
//         { id: args.courseProgressId } as any,
//         {
//           progressPercent: pct,
//           status:
//             pct >= 100 ? CourseStatus.COMPLETED : CourseStatus.IN_PROGRESS,
//           completedAt: pct >= 100 ? now : null,
//           lastAccessedAt: now,
//         },
//       );

//       return { sectionProgress: saved, courseProgressPercent: pct };
//     });
//   }
// }
