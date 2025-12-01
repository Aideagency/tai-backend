import { MigrationInterface, QueryRunner } from "typeorm";

export class CancelBooking1764596077821 implements MigrationInterface {
    name = 'CancelBooking1764596077821'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."Lessons_type_enum" AS ENUM('VIDEO', 'PDF', 'ARTICLE', 'QUIZ')`);
        await queryRunner.query(`CREATE TABLE "Lessons" ("id" SERIAL NOT NULL, "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "createdAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "deletedAt" TIMESTAMP, "deleted" boolean NOT NULL DEFAULT false, "suspended" boolean NOT NULL DEFAULT false, "courseId" integer NOT NULL, "zoho_file_id" character varying NOT NULL, "title" character varying NOT NULL, "type" "public"."Lessons_type_enum" NOT NULL DEFAULT 'VIDEO', "sortOrder" integer NOT NULL DEFAULT '0', "estimatedDurationSeconds" integer, "localUrl" character varying, CONSTRAINT "PK_eb7fc69f3d047c6a2b4f51c6327" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."Courses_accesstype_enum" AS ENUM('FREE', 'PAID')`);
        await queryRunner.query(`CREATE TABLE "Courses" ("id" SERIAL NOT NULL, "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "createdAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "deletedAt" TIMESTAMP, "deleted" boolean NOT NULL DEFAULT false, "suspended" boolean NOT NULL DEFAULT false, "zoho_course_id" character varying NOT NULL, "title" character varying, "description" text, "thumbnailUrl" character varying, "accessType" "public"."Courses_accesstype_enum" NOT NULL DEFAULT 'FREE', "price" numeric(10,2), "isPublished" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_f102f3c2fdb80f8407e562bf8e7" UNIQUE ("zoho_course_id"), CONSTRAINT "PK_e01ce00d3984a78d0693ab3ecbe" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "UserLessonProgress" ("id" SERIAL NOT NULL, "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "createdAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "deletedAt" TIMESTAMP, "deleted" boolean NOT NULL DEFAULT false, "suspended" boolean NOT NULL DEFAULT false, "userCourseProgressId" integer NOT NULL, "lessonId" integer NOT NULL, "isCompleted" boolean NOT NULL DEFAULT false, "progressPercent" double precision NOT NULL DEFAULT '0', "secondsWatched" integer NOT NULL DEFAULT '0', "lastAccessedAt" TIMESTAMP, CONSTRAINT "PK_9d1d2cf6b5f9acadd2b24d4a5f3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."UserCourseProgress_status_enum" AS ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED')`);
        await queryRunner.query(`CREATE TABLE "UserCourseProgress" ("id" SERIAL NOT NULL, "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "createdAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "deletedAt" TIMESTAMP, "deleted" boolean NOT NULL DEFAULT false, "suspended" boolean NOT NULL DEFAULT false, "userId" integer NOT NULL, "courseId" integer NOT NULL, "status" "public"."UserCourseProgress_status_enum" NOT NULL DEFAULT 'NOT_STARTED', "progressPercent" double precision NOT NULL DEFAULT '0', "startedAt" TIMESTAMP, "completedAt" TIMESTAMP, "lastAccessedAt" TIMESTAMP, CONSTRAINT "PK_7e8adfde3a6416e5af4eaa44d0a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."refund_request_type_enum" AS ENUM('FULL', 'PARTIAL', 'OTHER')`);
        await queryRunner.query(`CREATE TYPE "public"."refund_request_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'PROCESSED')`);
        await queryRunner.query(`CREATE TYPE "public"."refund_paid_for_enum" AS ENUM('EVENT', 'COUNSELLING', 'COURSE')`);
        await queryRunner.query(`CREATE TABLE "RefundRequests" ("id" SERIAL NOT NULL, "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "createdAt" TIMESTAMP(6) NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "deleted" boolean NOT NULL DEFAULT false, "suspended" boolean NOT NULL DEFAULT false, "type" "public"."refund_request_type_enum" NOT NULL, "status" "public"."refund_request_status_enum" NOT NULL DEFAULT 'PENDING', "paidFor" "public"."refund_paid_for_enum" NOT NULL, "requestedAmount" numeric(12,2) NOT NULL, "approvedAmount" numeric(12,2), "reason" text, "approvedAt" TIMESTAMP, "processedAt" TIMESTAMP, "externalReference" character varying, "userId" integer, "registrationId" integer, "counsellingBookingId" integer, "transactionId" integer, "requestedById" integer, "approvedById" integer, CONSTRAINT "PK_7fe6f276e83e1ff810fdfad77b8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f6f7f8f70df10c3bb1f62ba39f" ON "RefundRequests" ("registrationId", "status") `);
        await queryRunner.query(`ALTER TABLE "CounsellingBookings" ADD "hasRescheduled" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "Lessons" ADD CONSTRAINT "FK_5505a5ba8d7f043a94cddc8d708" FOREIGN KEY ("courseId") REFERENCES "Courses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "UserLessonProgress" ADD CONSTRAINT "FK_5b6dd10ac95225c6d2bd3844b32" FOREIGN KEY ("userCourseProgressId") REFERENCES "UserCourseProgress"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "UserLessonProgress" ADD CONSTRAINT "FK_f6aa89e21b21305b57ac202423d" FOREIGN KEY ("lessonId") REFERENCES "Lessons"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "UserCourseProgress" ADD CONSTRAINT "FK_5885c811d65f2617f6603d36572" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "UserCourseProgress" ADD CONSTRAINT "FK_981a331bbd2bc02b4dcfad1dde1" FOREIGN KEY ("courseId") REFERENCES "Courses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "RefundRequests" ADD CONSTRAINT "FK_399de258e6a3ffd62ff9e135edf" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "RefundRequests" ADD CONSTRAINT "FK_c944f39d772cb7919a91977bf4e" FOREIGN KEY ("registrationId") REFERENCES "EventRegistrations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "RefundRequests" ADD CONSTRAINT "FK_425bc435fe7bb640ef4797d693b" FOREIGN KEY ("counsellingBookingId") REFERENCES "CounsellingBookings"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "RefundRequests" ADD CONSTRAINT "FK_963b210993a55169087fc55d084" FOREIGN KEY ("transactionId") REFERENCES "Transactions"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "RefundRequests" ADD CONSTRAINT "FK_27406e49453b5c891a82b2c6fa3" FOREIGN KEY ("requestedById") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "RefundRequests" ADD CONSTRAINT "FK_10e54aa8b41f96d65475e741051" FOREIGN KEY ("approvedById") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "RefundRequests" DROP CONSTRAINT "FK_10e54aa8b41f96d65475e741051"`);
        await queryRunner.query(`ALTER TABLE "RefundRequests" DROP CONSTRAINT "FK_27406e49453b5c891a82b2c6fa3"`);
        await queryRunner.query(`ALTER TABLE "RefundRequests" DROP CONSTRAINT "FK_963b210993a55169087fc55d084"`);
        await queryRunner.query(`ALTER TABLE "RefundRequests" DROP CONSTRAINT "FK_425bc435fe7bb640ef4797d693b"`);
        await queryRunner.query(`ALTER TABLE "RefundRequests" DROP CONSTRAINT "FK_c944f39d772cb7919a91977bf4e"`);
        await queryRunner.query(`ALTER TABLE "RefundRequests" DROP CONSTRAINT "FK_399de258e6a3ffd62ff9e135edf"`);
        await queryRunner.query(`ALTER TABLE "UserCourseProgress" DROP CONSTRAINT "FK_981a331bbd2bc02b4dcfad1dde1"`);
        await queryRunner.query(`ALTER TABLE "UserCourseProgress" DROP CONSTRAINT "FK_5885c811d65f2617f6603d36572"`);
        await queryRunner.query(`ALTER TABLE "UserLessonProgress" DROP CONSTRAINT "FK_f6aa89e21b21305b57ac202423d"`);
        await queryRunner.query(`ALTER TABLE "UserLessonProgress" DROP CONSTRAINT "FK_5b6dd10ac95225c6d2bd3844b32"`);
        await queryRunner.query(`ALTER TABLE "Lessons" DROP CONSTRAINT "FK_5505a5ba8d7f043a94cddc8d708"`);
        await queryRunner.query(`ALTER TABLE "CounsellingBookings" DROP COLUMN "hasRescheduled"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f6f7f8f70df10c3bb1f62ba39f"`);
        await queryRunner.query(`DROP TABLE "RefundRequests"`);
        await queryRunner.query(`DROP TYPE "public"."refund_paid_for_enum"`);
        await queryRunner.query(`DROP TYPE "public"."refund_request_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."refund_request_type_enum"`);
        await queryRunner.query(`DROP TABLE "UserCourseProgress"`);
        await queryRunner.query(`DROP TYPE "public"."UserCourseProgress_status_enum"`);
        await queryRunner.query(`DROP TABLE "UserLessonProgress"`);
        await queryRunner.query(`DROP TABLE "Courses"`);
        await queryRunner.query(`DROP TYPE "public"."Courses_accesstype_enum"`);
        await queryRunner.query(`DROP TABLE "Lessons"`);
        await queryRunner.query(`DROP TYPE "public"."Lessons_type_enum"`);
    }

}
