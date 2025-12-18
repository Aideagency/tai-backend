import { MigrationInterface, QueryRunner } from 'typeorm';

export class BooksFixEnums1765975875048 implements MigrationInterface {
  name = 'BooksFixEnums1765975875048';

  public async up(queryRunner: QueryRunner): Promise<void> {
    /**
     * 1) Fix UserBookDownloads.status enum
     *    - create new enum type
     *    - move column to new enum
     */
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type t
          JOIN pg_namespace n ON n.oid = t.typnamespace
          WHERE t.typname = 'user_book_download_status_enum'
          AND n.nspname = 'public'
        ) THEN
          CREATE TYPE "public"."user_book_download_status_enum"
          AS ENUM ('PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED');
        END IF;
      END$$;
    `);

    // drop default first (safe)
    await queryRunner.query(`
      ALTER TABLE "UserBookDownloads"
      ALTER COLUMN "status" DROP DEFAULT
    `);

    // change column type to the new enum (casts through text)
    await queryRunner.query(`
      ALTER TABLE "UserBookDownloads"
      ALTER COLUMN "status"
      TYPE "public"."user_book_download_status_enum"
      USING "status"::text::"public"."user_book_download_status_enum"
    `);

    // restore default
    await queryRunner.query(`
      ALTER TABLE "UserBookDownloads"
      ALTER COLUMN "status"
      SET DEFAULT 'PENDING_PAYMENT'
    `);

    /**
     * 2) Fix EventRegistrations.status enum safely
     *
     * This is the safe Postgres pattern:
     * - rename old type to *_old
     * - create the new type with the original name
     * - alter column to new type
     * - drop old type
     */
    await queryRunner.query(`
      ALTER TYPE "public"."event_registration_status_enum"
      RENAME TO "event_registration_status_enum_old"
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."event_registration_status_enum"
      AS ENUM ('PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'REFUNDED')
    `);

    await queryRunner.query(`
      ALTER TABLE "EventRegistrations"
      ALTER COLUMN "status" DROP DEFAULT
    `);

    await queryRunner.query(`
      ALTER TABLE "EventRegistrations"
      ALTER COLUMN "status"
      TYPE "public"."event_registration_status_enum"
      USING "status"::text::"public"."event_registration_status_enum"
    `);

    await queryRunner.query(`
      ALTER TABLE "EventRegistrations"
      ALTER COLUMN "status"
      SET DEFAULT 'PENDING_PAYMENT'
    `);

    // now safe to drop the old enum type (nothing depends on it anymore)
    await queryRunner.query(`
      DROP TYPE "public"."event_registration_status_enum_old"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    /**
     * Reverse EventRegistrations enum change
     */
    await queryRunner.query(`
      ALTER TYPE "public"."event_registration_status_enum"
      RENAME TO "event_registration_status_enum_old"
    `);

    // recreate old type with same name expected by entity (it’s still event_registration_status_enum)
    await queryRunner.query(`
      CREATE TYPE "public"."event_registration_status_enum"
      AS ENUM ('PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'REFUNDED')
    `);

    await queryRunner.query(`
      ALTER TABLE "EventRegistrations"
      ALTER COLUMN "status" DROP DEFAULT
    `);

    await queryRunner.query(`
      ALTER TABLE "EventRegistrations"
      ALTER COLUMN "status"
      TYPE "public"."event_registration_status_enum"
      USING "status"::text::"public"."event_registration_status_enum"
    `);

    await queryRunner.query(`
      ALTER TABLE "EventRegistrations"
      ALTER COLUMN "status"
      SET DEFAULT 'PENDING_PAYMENT'
    `);

    await queryRunner.query(`
      DROP TYPE "public"."event_registration_status_enum_old"
    `);

    /**
     * Reverse UserBookDownloads enum change:
     * - convert column back to event_registration_status_enum (old shared type)
     * - drop user_book_download_status_enum
     */
    await queryRunner.query(`
      ALTER TABLE "UserBookDownloads"
      ALTER COLUMN "status" DROP DEFAULT
    `);

    await queryRunner.query(`
      ALTER TABLE "UserBookDownloads"
      ALTER COLUMN "status"
      TYPE "public"."event_registration_status_enum"
      USING "status"::text::"public"."event_registration_status_enum"
    `);

    await queryRunner.query(`
      ALTER TABLE "UserBookDownloads"
      ALTER COLUMN "status"
      SET DEFAULT 'PENDING_PAYMENT'
    `);

    await queryRunner.query(`
      DROP TYPE "public"."user_book_download_status_enum"
    `);
  }
}
