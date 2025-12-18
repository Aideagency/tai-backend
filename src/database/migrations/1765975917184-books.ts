import { MigrationInterface, QueryRunner } from 'typeorm';

export class Books1765975917184 implements MigrationInterface {
  name = 'Books1765975917184';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "Books" DROP CONSTRAINT "UQ_f3a87c78d9793df0cc6310de988"`,
    );
    await queryRunner.query(`ALTER TABLE "Books" DROP COLUMN "slug"`);
    await queryRunner.query(
      `ALTER TYPE "public"."event_registration_status_enum" RENAME TO "event_registration_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."user_book_download_status_enum" AS ENUM('PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "UserBookDownloads" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "UserBookDownloads" ALTER COLUMN "status" TYPE "public"."user_book_download_status_enum" USING "status"::"text"::"public"."user_book_download_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "UserBookDownloads" ALTER COLUMN "status" SET DEFAULT 'PENDING_PAYMENT'`,
    );

    await queryRunner.query(`
        ALTER TABLE "EventRegistrations"
  ALTER COLUMN "status"
  TYPE "public"."event_registration_status_enum"
  USING "status"::text::"public"."event_registration_status_enum"
`);
    await queryRunner.query(
      `DROP TYPE "public"."event_registration_status_enum_old"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."event_registration_status_enum_old" AS ENUM('PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'REFUNDED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "UserBookDownloads" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "UserBookDownloads" ALTER COLUMN "status" TYPE "public"."event_registration_status_enum_old" USING "status"::"text"::"public"."event_registration_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "UserBookDownloads" ALTER COLUMN "status" SET DEFAULT 'PENDING_PAYMENT'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."user_book_download_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."event_registration_status_enum_old" RENAME TO "event_registration_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Books" ADD "slug" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "Books" ADD CONSTRAINT "UQ_f3a87c78d9793df0cc6310de988" UNIQUE ("slug")`,
    );
  }
}
