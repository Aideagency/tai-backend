import { MigrationInterface, QueryRunner } from 'typeorm';

export class RestoreBookSlug1766061000000 implements MigrationInterface {
  name = 'RestoreBookSlug1766061000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1) Add slug column back (nullable initially so we can backfill)
    await queryRunner.query(`
      ALTER TABLE "Books"
      ADD COLUMN IF NOT EXISTS "slug" character varying
    `);

    // 2) Backfill slug for existing records that have null slug
    // Uses title + random-like suffix derived from id (stable and unique enough)
    await queryRunner.query(`
      UPDATE "Books"
      SET "slug" =
        LOWER(REGEXP_REPLACE(COALESCE("title", ''), '[^a-zA-Z0-9]+', '-', 'g'))
        || '-' || "id"
      WHERE "slug" IS NULL
    `);

    // 3) Ensure NOT NULL (since your entity expects slug required)
    await queryRunner.query(`
      ALTER TABLE "Books"
      ALTER COLUMN "slug" SET NOT NULL
    `);

    // 4) Add unique constraint (since entity has unique: true)
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'UQ_books_slug'
        ) THEN
          ALTER TABLE "Books"
          ADD CONSTRAINT "UQ_books_slug" UNIQUE ("slug");
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "Books" DROP CONSTRAINT IF EXISTS "UQ_books_slug"
    `);

    await queryRunner.query(`
      ALTER TABLE "Books" DROP COLUMN IF EXISTS "slug"
    `);
  }
}
