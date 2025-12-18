import { MigrationInterface, QueryRunner } from 'typeorm';

export class Books1765975917184 implements MigrationInterface {
  name = 'Books1765975917184';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "Books" DROP CONSTRAINT "UQ_f3a87c78d9793df0cc6310de988"`,
    );
    await queryRunner.query(`ALTER TABLE "Books" DROP COLUMN "slug"`);

    // Rename event enum to _old only if it exists and _old doesn't already exist
    await queryRunner.query(`
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_registration_status_enum')
     AND NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_registration_status_enum_old') THEN
    ALTER TYPE "public"."event_registration_status_enum" RENAME TO "event_registration_status_enum_old";
  END IF;
END
$$;
`);

    // Create book download enum only if it doesn't exist
    await queryRunner.query(`
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'user_book_download_status_enum'
      AND n.nspname = 'public'
  ) THEN
    CREATE TYPE "public"."user_book_download_status_enum"
    AS ENUM('PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED');
  END IF;
END
$$;
`);

    // Update UserBookDownloads.status type to book enum
    await queryRunner.query(
      `ALTER TABLE "UserBookDownloads" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "UserBookDownloads" ALTER COLUMN "status" TYPE "public"."user_book_download_status_enum" USING "status"::text::"public"."user_book_download_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "UserBookDownloads" ALTER COLUMN "status" SET DEFAULT 'PENDING_PAYMENT'`,
    );

    // Reapply EventRegistrations.status to event enum (now named event_registration_status_enum)
    // If you renamed it to _old above, this assumes another migration creates the new enum.
    // If not, we rename back by recreating it from _old.
    await queryRunner.query(`
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_registration_status_enum')
     AND EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_registration_status_enum_old') THEN
    ALTER TYPE "public"."event_registration_status_enum_old" RENAME TO "event_registration_status_enum";
  END IF;
END
$$;
`);

    await queryRunner.query(`
ALTER TABLE "EventRegistrations"
ALTER COLUMN "status"
TYPE "public"."event_registration_status_enum"
USING "status"::text::"public"."event_registration_status_enum"
`);

    // Drop old event enum if it still exists
    await queryRunner.query(`
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_registration_status_enum_old') THEN
    DROP TYPE "public"."event_registration_status_enum_old";
  END IF;
END
$$;
`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore slug + constraint
    await queryRunner.query(
      `ALTER TABLE "Books" ADD "slug" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "Books" ADD CONSTRAINT "UQ_f3a87c78d9793df0cc6310de988" UNIQUE ("slug")`,
    );

    // Recreate the old event enum (if needed) and switch EventRegistrations back
    await queryRunner.query(`
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_registration_status_enum_old') THEN
    CREATE TYPE "public"."event_registration_status_enum_old"
    AS ENUM('PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'REFUNDED');
  END IF;
END
$$;
`);

    await queryRunner.query(
      `ALTER TABLE "EventRegistrations" ALTER COLUMN "status" TYPE "public"."event_registration_status_enum_old" USING "status"::text::"public"."event_registration_status_enum_old"`,
    );

    // Drop current event enum and rename old back
    await queryRunner.query(`
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_registration_status_enum') THEN
    DROP TYPE "public"."event_registration_status_enum";
  END IF;
END
$$;
`);
    await queryRunner.query(
      `ALTER TYPE "public"."event_registration_status_enum_old" RENAME TO "event_registration_status_enum"`,
    );

    // IMPORTANT: UserBookDownloads.status should NOT use event enum.
    // We just drop the book enum if it exists.
    await queryRunner.query(
      `ALTER TABLE "UserBookDownloads" ALTER COLUMN "status" DROP DEFAULT`,
    );
    // optional: keep as text on down, or leave it (depends on your earlier schema)
    await queryRunner.query(
      `ALTER TABLE "UserBookDownloads" ALTER COLUMN "status" TYPE text USING "status"::text`,
    );

    await queryRunner.query(`
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_book_download_status_enum') THEN
    DROP TYPE "public"."user_book_download_status_enum";
  END IF;
END
$$;
`);
  }
}
