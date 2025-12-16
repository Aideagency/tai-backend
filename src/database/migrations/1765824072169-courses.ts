import { MigrationInterface, QueryRunner } from "typeorm";

export class Courses1765824072169 implements MigrationInterface {
    name = 'Courses1765824072169'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "UserLessonProgress" DROP CONSTRAINT "FK_5b6dd10ac95225c6d2bd3844b32"`);
        await queryRunner.query(`ALTER TABLE "UserLessonProgress" DROP CONSTRAINT "FK_f6aa89e21b21305b57ac202423d"`);
        await queryRunner.query(`CREATE TYPE "public"."lessons_zohotype_enum" AS ENUM('CHAPTER', 'DOCUMENT', 'ASSIGNMENT', 'QUIZ', 'VIDEO', 'ARTICLE')`);
        await queryRunner.query(`CREATE TYPE "public"."lessons_status_enum" AS ENUM('ACTIVE', 'UNPUBLISHED', 'INACTIVE')`);
        await queryRunner.query(`CREATE TABLE "lessons" ("id" SERIAL NOT NULL, "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "createdAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "deletedAt" TIMESTAMP, "deleted" boolean NOT NULL DEFAULT false, "suspended" boolean NOT NULL DEFAULT false, "zoho_lesson_id" character varying NOT NULL, "zoho_parent_id" character varying, "title" character varying(255) NOT NULL, "slug" character varying(255), "zohoType" "public"."lessons_zohotype_enum" NOT NULL, "status" "public"."lessons_status_enum" NOT NULL DEFAULT 'ACTIVE', "sortOrder" integer NOT NULL DEFAULT '0', "estimatedDurationSeconds" integer, "zohoMeta" json, "zohoModifiedAt" TIMESTAMP WITH TIME ZONE, "course_id" integer, CONSTRAINT "PK_9b9a8d455cac672d262d7275730" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_6f841844add371f587b00bd91d" ON "lessons" ("course_id", "zoho_lesson_id") `);
        await queryRunner.query(`CREATE TYPE "public"."UserSubscriptions_subscriptionplan_enum" AS ENUM('BASIC', 'PREMIUM')`);
        await queryRunner.query(`CREATE TYPE "public"."UserSubscriptions_status_enum" AS ENUM('ACTIVE', 'EXPIRED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "UserSubscriptions" ("id" SERIAL NOT NULL, "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "createdAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "deletedAt" TIMESTAMP, "deleted" boolean NOT NULL DEFAULT false, "suspended" boolean NOT NULL DEFAULT false, "userId" integer NOT NULL, "courseId" integer NOT NULL, "subscriptionPlan" "public"."UserSubscriptions_subscriptionplan_enum" NOT NULL DEFAULT 'BASIC', "subscriptionStartDate" TIMESTAMP, "subscriptionEndDate" TIMESTAMP, "status" "public"."UserSubscriptions_status_enum" NOT NULL DEFAULT 'ACTIVE', CONSTRAINT "PK_56cefb632fb2c3e9e691137ae8f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."UserPurchases_itemtype_enum" AS ENUM('COURSE', 'BOOK')`);
        await queryRunner.query(`CREATE TYPE "public"."UserPurchases_status_enum" AS ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED')`);
        await queryRunner.query(`CREATE TABLE "UserPurchases" ("id" SERIAL NOT NULL, "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "createdAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "deletedAt" TIMESTAMP, "deleted" boolean NOT NULL DEFAULT false, "suspended" boolean NOT NULL DEFAULT false, "userId" integer NOT NULL, "itemType" "public"."UserPurchases_itemtype_enum" NOT NULL, "itemId" integer NOT NULL, "status" "public"."UserPurchases_status_enum" NOT NULL DEFAULT 'PENDING', "amount" numeric(10,2) NOT NULL, "paymentRef" character varying, CONSTRAINT "PK_3880bead0f6a9478d2fd79723d3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_97f8e3d9c172164216e43ca238" ON "UserPurchases" ("userId", "itemType", "itemId") `);
        await queryRunner.query(`ALTER TABLE "UserLessonProgress" DROP COLUMN "userCourseProgressId"`);
        await queryRunner.query(`ALTER TABLE "UserLessonProgress" DROP COLUMN "lessonId"`);
        await queryRunner.query(`ALTER TABLE "UserLessonProgress" DROP COLUMN "isCompleted"`);
        await queryRunner.query(`ALTER TABLE "UserLessonProgress" DROP COLUMN "secondsWatched"`);
        await queryRunner.query(`ALTER TABLE "UserLessonProgress" ADD "user_id" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "UserLessonProgress" ADD "course_progress_id" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "UserLessonProgress" ADD "lesson_id" integer NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."UserLessonProgress_status_enum" AS ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED')`);
        await queryRunner.query(`ALTER TABLE "UserLessonProgress" ADD "status" "public"."UserLessonProgress_status_enum" NOT NULL DEFAULT 'NOT_STARTED'`);
        await queryRunner.query(`ALTER TABLE "UserLessonProgress" ADD "startedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "UserLessonProgress" ADD "completedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "Events" ALTER COLUMN "createdAt" SET DEFAULT ('now'::text)::timestamp(6) with time zone`);
        await queryRunner.query(`ALTER TABLE "EventRegistrations" ALTER COLUMN "createdAt" SET DEFAULT ('now'::text)::timestamp(6) with time zone`);
        await queryRunner.query(`ALTER TABLE "Counsellings" ALTER COLUMN "createdAt" SET DEFAULT ('now'::text)::timestamp(6) with time zone`);
        await queryRunner.query(`ALTER TABLE "Admins" ALTER COLUMN "createdAt" SET DEFAULT ('now'::text)::timestamp(6) with time zone`);
        await queryRunner.query(`ALTER TABLE "CounsellingBookings" ALTER COLUMN "createdAt" SET DEFAULT ('now'::text)::timestamp(6) with time zone`);
        await queryRunner.query(`ALTER TABLE "RefundRequests" ALTER COLUMN "createdAt" SET DEFAULT ('now'::text)::timestamp(6) with time zone`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_3aff9a5f008a7ae618ea29f74d" ON "UserLessonProgress" ("user_id", "course_progress_id", "lesson_id") `);
        await queryRunner.query(`ALTER TABLE "lessons" ADD CONSTRAINT "FK_3c4e299cf8ed04093935e2e22fe" FOREIGN KEY ("course_id") REFERENCES "Courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "UserSubscriptions" ADD CONSTRAINT "FK_d591f708b32c7e119e868be2a23" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "UserSubscriptions" ADD CONSTRAINT "FK_e7e4ec42fd5a6f6653044563754" FOREIGN KEY ("courseId") REFERENCES "Courses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "UserLessonProgress" ADD CONSTRAINT "FK_0753956d7faa262834efd1ff213" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "UserLessonProgress" ADD CONSTRAINT "FK_894f9a6ece16a83dd2fe2c13c81" FOREIGN KEY ("course_progress_id") REFERENCES "UserCourseProgress"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "UserLessonProgress" ADD CONSTRAINT "FK_ddb21a61647fa3530b5c09c9af3" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "UserPurchases" ADD CONSTRAINT "FK_43af1d1713f42b7c581c860c2d3" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "UserPurchases" DROP CONSTRAINT "FK_43af1d1713f42b7c581c860c2d3"`);
        await queryRunner.query(`ALTER TABLE "UserLessonProgress" DROP CONSTRAINT "FK_ddb21a61647fa3530b5c09c9af3"`);
        await queryRunner.query(`ALTER TABLE "UserLessonProgress" DROP CONSTRAINT "FK_894f9a6ece16a83dd2fe2c13c81"`);
        await queryRunner.query(`ALTER TABLE "UserLessonProgress" DROP CONSTRAINT "FK_0753956d7faa262834efd1ff213"`);
        await queryRunner.query(`ALTER TABLE "UserSubscriptions" DROP CONSTRAINT "FK_e7e4ec42fd5a6f6653044563754"`);
        await queryRunner.query(`ALTER TABLE "UserSubscriptions" DROP CONSTRAINT "FK_d591f708b32c7e119e868be2a23"`);
        await queryRunner.query(`ALTER TABLE "lessons" DROP CONSTRAINT "FK_3c4e299cf8ed04093935e2e22fe"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3aff9a5f008a7ae618ea29f74d"`);
        await queryRunner.query(`ALTER TABLE "RefundRequests" ALTER COLUMN "createdAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "CounsellingBookings" ALTER COLUMN "createdAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "Admins" ALTER COLUMN "createdAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "Counsellings" ALTER COLUMN "createdAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "EventRegistrations" ALTER COLUMN "createdAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "Events" ALTER COLUMN "createdAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "UserLessonProgress" DROP COLUMN "completedAt"`);
        await queryRunner.query(`ALTER TABLE "UserLessonProgress" DROP COLUMN "startedAt"`);
        await queryRunner.query(`ALTER TABLE "UserLessonProgress" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."UserLessonProgress_status_enum"`);
        await queryRunner.query(`ALTER TABLE "UserLessonProgress" DROP COLUMN "lesson_id"`);
        await queryRunner.query(`ALTER TABLE "UserLessonProgress" DROP COLUMN "course_progress_id"`);
        await queryRunner.query(`ALTER TABLE "UserLessonProgress" DROP COLUMN "user_id"`);
        await queryRunner.query(`ALTER TABLE "UserLessonProgress" ADD "secondsWatched" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "UserLessonProgress" ADD "isCompleted" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "UserLessonProgress" ADD "lessonId" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "UserLessonProgress" ADD "userCourseProgressId" integer NOT NULL`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97f8e3d9c172164216e43ca238"`);
        await queryRunner.query(`DROP TABLE "UserPurchases"`);
        await queryRunner.query(`DROP TYPE "public"."UserPurchases_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."UserPurchases_itemtype_enum"`);
        await queryRunner.query(`DROP TABLE "UserSubscriptions"`);
        await queryRunner.query(`DROP TYPE "public"."UserSubscriptions_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."UserSubscriptions_subscriptionplan_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6f841844add371f587b00bd91d"`);
        await queryRunner.query(`DROP TABLE "lessons"`);
        await queryRunner.query(`DROP TYPE "public"."lessons_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."lessons_zohotype_enum"`);
        await queryRunner.query(`ALTER TABLE "UserLessonProgress" ADD CONSTRAINT "FK_f6aa89e21b21305b57ac202423d" FOREIGN KEY ("lessonId") REFERENCES "Lessons"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "UserLessonProgress" ADD CONSTRAINT "FK_5b6dd10ac95225c6d2bd3844b32" FOREIGN KEY ("userCourseProgressId") REFERENCES "UserCourseProgress"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
