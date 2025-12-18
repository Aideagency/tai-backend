import { MigrationInterface, QueryRunner } from "typeorm";

export class OwnershipStatus1766053801592 implements MigrationInterface {
    name = 'OwnershipStatus1766053801592'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."Transactions_paid_for_enum" RENAME TO "Transactions_paid_for_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."Transactions_paid_for_enum" AS ENUM('EVENT', 'COUNSELLING', 'COURSE', 'BOOK')`);
        await queryRunner.query(`ALTER TABLE "Transactions" ALTER COLUMN "paid_for" TYPE "public"."Transactions_paid_for_enum" USING "paid_for"::"text"::"public"."Transactions_paid_for_enum"`);
        await queryRunner.query(`DROP TYPE "public"."Transactions_paid_for_enum_old"`);
        await queryRunner.query(`ALTER TABLE "Books" ALTER COLUMN "createdAt" SET DEFAULT ('now'::text)::timestamp(6) with time zone`);
        await queryRunner.query(`ALTER TABLE "UserBookDownloads" ALTER COLUMN "createdAt" SET DEFAULT ('now'::text)::timestamp(6) with time zone`);
        await queryRunner.query(`ALTER TYPE "public"."user_book_download_status_enum" RENAME TO "user_book_download_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."user_book_download_ownership_status_enum" AS ENUM('PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED')`);
        await queryRunner.query(`ALTER TABLE "UserBookDownloads" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "UserBookDownloads" ALTER COLUMN "status" TYPE "public"."user_book_download_ownership_status_enum" USING "status"::"text"::"public"."user_book_download_ownership_status_enum"`);
        await queryRunner.query(`ALTER TABLE "UserBookDownloads" ALTER COLUMN "status" SET DEFAULT 'PENDING_PAYMENT'`);
        await queryRunner.query(`DROP TYPE "public"."user_book_download_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "Events" ALTER COLUMN "createdAt" SET DEFAULT ('now'::text)::timestamp(6) with time zone`);
        await queryRunner.query(`ALTER TABLE "EventRegistrations" ALTER COLUMN "createdAt" SET DEFAULT ('now'::text)::timestamp(6) with time zone`);
        await queryRunner.query(`ALTER TABLE "Counsellings" ALTER COLUMN "createdAt" SET DEFAULT ('now'::text)::timestamp(6) with time zone`);
        await queryRunner.query(`ALTER TABLE "Admins" ALTER COLUMN "createdAt" SET DEFAULT ('now'::text)::timestamp(6) with time zone`);
        await queryRunner.query(`ALTER TABLE "CounsellingBookings" ALTER COLUMN "createdAt" SET DEFAULT ('now'::text)::timestamp(6) with time zone`);
        await queryRunner.query(`ALTER TABLE "RefundRequests" ALTER COLUMN "createdAt" SET DEFAULT ('now'::text)::timestamp(6) with time zone`);
        await queryRunner.query(`ALTER TYPE "public"."refund_paid_for_enum" RENAME TO "refund_paid_for_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."refund_paid_for_enum" AS ENUM('EVENT', 'COUNSELLING', 'COURSE', 'BOOK')`);
        await queryRunner.query(`ALTER TABLE "RefundRequests" ALTER COLUMN "paidFor" TYPE "public"."refund_paid_for_enum" USING "paidFor"::"text"::"public"."refund_paid_for_enum"`);
        await queryRunner.query(`DROP TYPE "public"."refund_paid_for_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."refund_paid_for_enum_old" AS ENUM('EVENT', 'COUNSELLING', 'COURSE', 'BOOk')`);
        await queryRunner.query(`ALTER TABLE "RefundRequests" ALTER COLUMN "paidFor" TYPE "public"."refund_paid_for_enum_old" USING "paidFor"::"text"::"public"."refund_paid_for_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."refund_paid_for_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."refund_paid_for_enum_old" RENAME TO "refund_paid_for_enum"`);
        await queryRunner.query(`ALTER TABLE "RefundRequests" ALTER COLUMN "createdAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "CounsellingBookings" ALTER COLUMN "createdAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "Admins" ALTER COLUMN "createdAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "Counsellings" ALTER COLUMN "createdAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "EventRegistrations" ALTER COLUMN "createdAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "Events" ALTER COLUMN "createdAt" SET DEFAULT now()`);
        await queryRunner.query(`CREATE TYPE "public"."user_book_download_status_enum_old" AS ENUM('PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED')`);
        await queryRunner.query(`ALTER TABLE "UserBookDownloads" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "UserBookDownloads" ALTER COLUMN "status" TYPE "public"."user_book_download_status_enum_old" USING "status"::"text"::"public"."user_book_download_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "UserBookDownloads" ALTER COLUMN "status" SET DEFAULT 'PENDING_PAYMENT'`);
        await queryRunner.query(`DROP TYPE "public"."user_book_download_ownership_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."user_book_download_status_enum_old" RENAME TO "user_book_download_status_enum"`);
        await queryRunner.query(`ALTER TABLE "UserBookDownloads" ALTER COLUMN "createdAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "Books" ALTER COLUMN "createdAt" SET DEFAULT now()`);
        await queryRunner.query(`CREATE TYPE "public"."Transactions_paid_for_enum_old" AS ENUM('EVENT', 'COUNSELLING', 'COURSE', 'BOOk')`);
        await queryRunner.query(`ALTER TABLE "Transactions" ALTER COLUMN "paid_for" TYPE "public"."Transactions_paid_for_enum_old" USING "paid_for"::"text"::"public"."Transactions_paid_for_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."Transactions_paid_for_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."Transactions_paid_for_enum_old" RENAME TO "Transactions_paid_for_enum"`);
    }

}
