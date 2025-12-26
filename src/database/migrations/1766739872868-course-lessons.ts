import { MigrationInterface, QueryRunner } from "typeorm";

export class CourseLessons1766739872868 implements MigrationInterface {
    name = 'CourseLessons1766739872868'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "lesson_attachments" DROP CONSTRAINT "FK_2cc9808f14a629ef4e5d792f5e2"`);
        await queryRunner.query(`ALTER TABLE "UserCourseProgress" DROP CONSTRAINT "FK_981a331bbd2bc02b4dcfad1dde1"`);
        await queryRunner.query(`ALTER TABLE "lesson_sections" DROP CONSTRAINT "FK_641f3a83ba2f6fa20773cbed2cc"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_39a94200768edfbf102291bb34"`);
        await queryRunner.query(`ALTER TABLE "courses" DROP CONSTRAINT "UQ_a3bb2d01cfa0f95bc5e034e1b7a"`);
        await queryRunner.query(`ALTER TABLE "courses" DROP COLUMN "slug"`);
        await queryRunner.query(`ALTER TABLE "courses" DROP COLUMN "accessType"`);
        await queryRunner.query(`DROP TYPE "public"."courses_accesstype_enum"`);
        await queryRunner.query(`ALTER TABLE "lesson_attachments" DROP COLUMN "section_id"`);
        await queryRunner.query(`ALTER TABLE "lessons" DROP CONSTRAINT "UQ_ca2edfa23c965f9c435572a7de3"`);
        await queryRunner.query(`ALTER TABLE "lessons" DROP COLUMN "slug"`);
        await queryRunner.query(`ALTER TABLE "lessons" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."lessons_status_enum"`);
        await queryRunner.query(`ALTER TABLE "courses" ADD "isFree" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "lesson_attachments" ADD "lesson_id" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lessons" ADD "youtubeUrl" character varying`);
        await queryRunner.query(`ALTER TABLE "courses" DROP COLUMN "title"`);
        await queryRunner.query(`ALTER TABLE "courses" ADD "title" character varying(180) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "courses" DROP COLUMN "currency"`);
        await queryRunner.query(`ALTER TABLE "courses" ADD "currency" character varying(8) NOT NULL DEFAULT 'NGN'`);
        await queryRunner.query(`ALTER TABLE "lesson_attachments" ALTER COLUMN "publicId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lessons" ALTER COLUMN "title" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lessons" ALTER COLUMN "sortOrder" DROP DEFAULT`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_39a94200768edfbf102291bb34" ON "lessons" ("course_id", "sortOrder") `);
        await queryRunner.query(`ALTER TABLE "lesson_attachments" ADD CONSTRAINT "FK_f231647f246dbfb9ec67faa800c" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "lesson_attachments" DROP CONSTRAINT "FK_f231647f246dbfb9ec67faa800c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_39a94200768edfbf102291bb34"`);
        await queryRunner.query(`ALTER TABLE "lessons" ALTER COLUMN "sortOrder" SET DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "lessons" ALTER COLUMN "title" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lesson_attachments" ALTER COLUMN "publicId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "courses" DROP COLUMN "currency"`);
        await queryRunner.query(`ALTER TABLE "courses" ADD "currency" character varying NOT NULL DEFAULT 'NGN'`);
        await queryRunner.query(`ALTER TABLE "courses" DROP COLUMN "title"`);
        await queryRunner.query(`ALTER TABLE "courses" ADD "title" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lessons" DROP COLUMN "youtubeUrl"`);
        await queryRunner.query(`ALTER TABLE "lesson_attachments" DROP COLUMN "lesson_id"`);
        await queryRunner.query(`ALTER TABLE "courses" DROP COLUMN "isFree"`);
        await queryRunner.query(`CREATE TYPE "public"."lessons_status_enum" AS ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED')`);
        await queryRunner.query(`ALTER TABLE "lessons" ADD "status" "public"."lessons_status_enum" NOT NULL DEFAULT 'DRAFT'`);
        await queryRunner.query(`ALTER TABLE "lessons" ADD "slug" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lessons" ADD CONSTRAINT "UQ_ca2edfa23c965f9c435572a7de3" UNIQUE ("slug")`);
        await queryRunner.query(`ALTER TABLE "lesson_attachments" ADD "section_id" integer NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."courses_accesstype_enum" AS ENUM('FREE', 'PAID')`);
        await queryRunner.query(`ALTER TABLE "courses" ADD "accessType" "public"."courses_accesstype_enum" NOT NULL DEFAULT 'FREE'`);
        await queryRunner.query(`ALTER TABLE "courses" ADD "slug" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "courses" ADD CONSTRAINT "UQ_a3bb2d01cfa0f95bc5e034e1b7a" UNIQUE ("slug")`);
        await queryRunner.query(`CREATE INDEX "IDX_39a94200768edfbf102291bb34" ON "lessons" ("course_id", "sortOrder") `);
        await queryRunner.query(`ALTER TABLE "lesson_sections" ADD CONSTRAINT "FK_641f3a83ba2f6fa20773cbed2cc" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "UserCourseProgress" ADD CONSTRAINT "FK_981a331bbd2bc02b4dcfad1dde1" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lesson_attachments" ADD CONSTRAINT "FK_2cc9808f14a629ef4e5d792f5e2" FOREIGN KEY ("section_id") REFERENCES "lesson_sections"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
