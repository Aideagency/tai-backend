import { MigrationInterface, QueryRunner } from 'typeorm';

export class BooksEnum1766050504941 implements MigrationInterface {
  name = 'BooksEnum1766050504941';

  public async up(queryRunner: QueryRunner): Promise<void> {
    /* ---------------- TRANSACTIONS: paid_for enum ---------------- */

    // Rename current enum -> old
    await queryRunner.query(
      `ALTER TYPE "public"."Transactions_paid_for_enum" RENAME TO "Transactions_paid_for_enum_old"`,
    );

    // Create new enum with BOOK
    await queryRunner.query(
      `CREATE TYPE "public"."Transactions_paid_for_enum" AS ENUM('EVENT', 'COUNSELLING', 'COURSE', 'BOOK')`,
    );

    // Alter column type + convert BOOk -> BOOK during cast
    await queryRunner.query(`
      ALTER TABLE "Transactions"
      ALTER COLUMN "paid_for"
      TYPE "public"."Transactions_paid_for_enum"
      USING (
        CASE
          WHEN "paid_for" IS NULL THEN 'EVENT'
          WHEN "paid_for"::text = 'BOOk' THEN 'BOOK'
          ELSE "paid_for"::text
        END
      )::"public"."Transactions_paid_for_enum"
    `);

    // Drop old enum
    await queryRunner.query(
      `DROP TYPE "public"."Transactions_paid_for_enum_old"`,
    );

    /* ---------------- DEFAULTS (your existing statements) ---------------- */

    await queryRunner.query(
      `ALTER TABLE "Books" ALTER COLUMN "createdAt" SET DEFAULT ('now'::text)::timestamp(6) with time zone`,
    );
    await queryRunner.query(
      `ALTER TABLE "UserBookDownloads" ALTER COLUMN "createdAt" SET DEFAULT ('now'::text)::timestamp(6) with time zone`,
    );
    await queryRunner.query(
      `ALTER TABLE "Events" ALTER COLUMN "createdAt" SET DEFAULT ('now'::text)::timestamp(6) with time zone`,
    );
    await queryRunner.query(
      `ALTER TABLE "EventRegistrations" ALTER COLUMN "createdAt" SET DEFAULT ('now'::text)::timestamp(6) with time zone`,
    );
    await queryRunner.query(
      `ALTER TABLE "Counsellings" ALTER COLUMN "createdAt" SET DEFAULT ('now'::text)::timestamp(6) with time zone`,
    );
    await queryRunner.query(
      `ALTER TABLE "Admins" ALTER COLUMN "createdAt" SET DEFAULT ('now'::text)::timestamp(6) with time zone`,
    );
    await queryRunner.query(
      `ALTER TABLE "CounsellingBookings" ALTER COLUMN "createdAt" SET DEFAULT ('now'::text)::timestamp(6) with time zone`,
    );
    await queryRunner.query(
      `ALTER TABLE "RefundRequests" ALTER COLUMN "createdAt" SET DEFAULT ('now'::text)::timestamp(6) with time zone`,
    );

    /* ---------------- REFUNDS: paidFor enum ---------------- */

    // Rename current enum -> old
    await queryRunner.query(
      `ALTER TYPE "public"."refund_paid_for_enum" RENAME TO "refund_paid_for_enum_old"`,
    );

    // Create new enum with BOOK
    await queryRunner.query(
      `CREATE TYPE "public"."refund_paid_for_enum" AS ENUM('EVENT', 'COUNSELLING', 'COURSE', 'BOOK')`,
    );

    // Alter column type + convert BOOk -> BOOK during cast
    await queryRunner.query(`
      ALTER TABLE "RefundRequests"
      ALTER COLUMN "paidFor"
      TYPE "public"."refund_paid_for_enum"
      USING (
        CASE
          WHEN "paidFor" IS NULL THEN 'EVENT'
          WHEN "paidFor"::text = 'BOOk' THEN 'BOOK'
          ELSE "paidFor"::text
        END
      )::"public"."refund_paid_for_enum"
    `);

    // Drop old enum
    await queryRunner.query(`DROP TYPE "public"."refund_paid_for_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    /* ---------------- REFUNDS: revert BOOK -> BOOk ---------------- */

    await queryRunner.query(
      `ALTER TYPE "public"."refund_paid_for_enum" RENAME TO "refund_paid_for_enum_old"`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."refund_paid_for_enum" AS ENUM('EVENT', 'COUNSELLING', 'COURSE', 'BOOk')`,
    );

    await queryRunner.query(`
      ALTER TABLE "RefundRequests"
      ALTER COLUMN "paidFor"
      TYPE "public"."refund_paid_for_enum"
      USING (
        CASE
          WHEN "paidFor" IS NULL THEN 'EVENT'
          WHEN "paidFor"::text = 'BOOK' THEN 'BOOk'
          ELSE "paidFor"::text
        END
      )::"public"."refund_paid_for_enum"
    `);

    await queryRunner.query(`DROP TYPE "public"."refund_paid_for_enum_old"`);

    /* ---------------- TRANSACTIONS: revert BOOK -> BOOk ---------------- */

    await queryRunner.query(
      `ALTER TYPE "public"."Transactions_paid_for_enum" RENAME TO "Transactions_paid_for_enum_old"`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."Transactions_paid_for_enum" AS ENUM('EVENT', 'COUNSELLING', 'COURSE', 'BOOk')`,
    );

    await queryRunner.query(`
      ALTER TABLE "Transactions"
      ALTER COLUMN "paid_for"
      TYPE "public"."Transactions_paid_for_enum"
      USING (
        CASE
          WHEN "paid_for" IS NULL THEN 'EVENT'
          WHEN "paid_for"::text = 'BOOK' THEN 'BOOk'
          ELSE "paid_for"::text
        END
      )::"public"."Transactions_paid_for_enum"
    `);

    await queryRunner.query(
      `DROP TYPE "public"."Transactions_paid_for_enum_old"`,
    );
  }
}
