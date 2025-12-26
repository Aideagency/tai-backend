import { MigrationInterface, QueryRunner } from "typeorm";

export class CourseAccess1766789105674 implements MigrationInterface {
    name = 'CourseAccess1766789105674'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "course_access" DROP CONSTRAINT "FK_4aa2114fe1fdfc3490ca153e1d4"`);
        await queryRunner.query(`ALTER TABLE "course_access" DROP CONSTRAINT "FK_bffac211c1be67a096c94a7167c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_02a4cae0a5ab7f68e5c63b18f5"`);
        await queryRunner.query(`ALTER TABLE "course_access" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "course_access" DROP COLUMN "courseId"`);
        await queryRunner.query(`ALTER TABLE "course_access" ADD "user_id" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "course_access" ADD "course_id" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "course_access" ALTER COLUMN "kind" SET DEFAULT 'FREE'`);
        await queryRunner.query(`ALTER TYPE "public"."course_access_status_enum" RENAME TO "course_access_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."course_access_status_enum" AS ENUM('ACTIVE', 'EXPIRED', 'REVOKED', 'PENDING')`);
        await queryRunner.query(`ALTER TABLE "course_access" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "course_access" ALTER COLUMN "status" TYPE "public"."course_access_status_enum" USING "status"::"text"::"public"."course_access_status_enum"`);
        await queryRunner.query(`ALTER TABLE "course_access" ALTER COLUMN "status" SET DEFAULT 'PENDING'`);
        await queryRunner.query(`DROP TYPE "public"."course_access_status_enum_old"`);
        await queryRunner.query(`CREATE INDEX "IDX_e1cd9b8371d65d9f78688a69e0" ON "course_access" ("user_id", "status") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_f02f9f0df9964c01dd33fb8025" ON "course_access" ("user_id", "course_id") `);
        await queryRunner.query(`ALTER TABLE "course_access" ADD CONSTRAINT "FK_b3e4013e99e2c48b6ea473642f0" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "course_access" ADD CONSTRAINT "FK_ef2be1d3709ed30c0c984d5c4a4" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "course_access" DROP CONSTRAINT "FK_ef2be1d3709ed30c0c984d5c4a4"`);
        await queryRunner.query(`ALTER TABLE "course_access" DROP CONSTRAINT "FK_b3e4013e99e2c48b6ea473642f0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f02f9f0df9964c01dd33fb8025"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e1cd9b8371d65d9f78688a69e0"`);
        await queryRunner.query(`CREATE TYPE "public"."course_access_status_enum_old" AS ENUM('ACTIVE', 'EXPIRED', 'REVOKED')`);
        await queryRunner.query(`ALTER TABLE "course_access" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "course_access" ALTER COLUMN "status" TYPE "public"."course_access_status_enum_old" USING "status"::"text"::"public"."course_access_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "course_access" ALTER COLUMN "status" SET DEFAULT 'ACTIVE'`);
        await queryRunner.query(`DROP TYPE "public"."course_access_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."course_access_status_enum_old" RENAME TO "course_access_status_enum"`);
        await queryRunner.query(`ALTER TABLE "course_access" ALTER COLUMN "kind" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "course_access" DROP COLUMN "course_id"`);
        await queryRunner.query(`ALTER TABLE "course_access" DROP COLUMN "user_id"`);
        await queryRunner.query(`ALTER TABLE "course_access" ADD "courseId" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "course_access" ADD "userId" integer NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_02a4cae0a5ab7f68e5c63b18f5" ON "course_access" ("courseId", "userId") `);
        await queryRunner.query(`ALTER TABLE "course_access" ADD CONSTRAINT "FK_bffac211c1be67a096c94a7167c" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "course_access" ADD CONSTRAINT "FK_4aa2114fe1fdfc3490ca153e1d4" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
