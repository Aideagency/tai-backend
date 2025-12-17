import { MigrationInterface, QueryRunner } from "typeorm";

export class Books1765972311348 implements MigrationInterface {
    name = 'Books1765972311348'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."Books_ownershiptype_enum" AS ENUM('IN_HOUSE', 'EXTERNAL')`);
        await queryRunner.query(`CREATE TYPE "public"."Books_accesstype_enum" AS ENUM('FREE', 'PAID')`);
        await queryRunner.query(`CREATE TABLE "Books" ("id" SERIAL NOT NULL, "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "createdAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "deletedAt" TIMESTAMP, "deleted" boolean NOT NULL DEFAULT false, "suspended" boolean NOT NULL DEFAULT false, "slug" character varying NOT NULL, "title" character varying NOT NULL, "author" character varying, "description" text, "coverImageUrl" character varying, "coverImagePublicId" character varying, "ownershipType" "public"."Books_ownershiptype_enum" NOT NULL DEFAULT 'IN_HOUSE', "accessType" "public"."Books_accesstype_enum", "price" numeric(10,2), "currency" character varying NOT NULL DEFAULT 'NGN', "pdfUrl" text, "pdfPublicId" character varying, "externalUrl" text, "isPublished" boolean NOT NULL DEFAULT true, "publishDate" character varying, "isbn" character varying, CONSTRAINT "UQ_f3a87c78d9793df0cc6310de988" UNIQUE ("slug"), CONSTRAINT "PK_45fc00b09d337eadf83e9240157" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "UserBookDownloads" ("id" SERIAL NOT NULL, "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "createdAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "deletedAt" TIMESTAMP, "deleted" boolean NOT NULL DEFAULT false, "suspended" boolean NOT NULL DEFAULT false, "userId" integer NOT NULL, "bookId" integer NOT NULL, "downloadedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), "paymentRef" character varying, "status" "public"."event_registration_status_enum" NOT NULL DEFAULT 'PENDING_PAYMENT', "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_2ac6af74046bb93cfac432cddc0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_f5ec900b10e0b63ffe766311d1" ON "UserBookDownloads" ("paymentRef") WHERE "paymentRef" IS NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_56048469fcc831362af2268273" ON "UserBookDownloads" ("userId", "bookId") `);
        await queryRunner.query(`ALTER TYPE "public"."Transactions_paid_for_enum" RENAME TO "Transactions_paid_for_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."Transactions_paid_for_enum" AS ENUM('EVENT', 'COUNSELLING', 'COURSE', 'BOOk')`);
        await queryRunner.query(`ALTER TABLE "Transactions" ALTER COLUMN "paid_for" TYPE "public"."Transactions_paid_for_enum" USING "paid_for"::"text"::"public"."Transactions_paid_for_enum"`);
        await queryRunner.query(`DROP TYPE "public"."Transactions_paid_for_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."refund_paid_for_enum" RENAME TO "refund_paid_for_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."refund_paid_for_enum" AS ENUM('EVENT', 'COUNSELLING', 'COURSE', 'BOOk')`);
        await queryRunner.query(`ALTER TABLE "RefundRequests" ALTER COLUMN "paidFor" TYPE "public"."refund_paid_for_enum" USING "paidFor"::"text"::"public"."refund_paid_for_enum"`);
        await queryRunner.query(`DROP TYPE "public"."refund_paid_for_enum_old"`);
        await queryRunner.query(`ALTER TABLE "UserBookDownloads" ADD CONSTRAINT "FK_6d36a2e571cb01fb33cd6260a9a" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "UserBookDownloads" ADD CONSTRAINT "FK_4f3095c93a1ba1f01adba6df956" FOREIGN KEY ("bookId") REFERENCES "Books"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "UserBookDownloads" DROP CONSTRAINT "FK_4f3095c93a1ba1f01adba6df956"`);
        await queryRunner.query(`ALTER TABLE "UserBookDownloads" DROP CONSTRAINT "FK_6d36a2e571cb01fb33cd6260a9a"`);
        await queryRunner.query(`CREATE TYPE "public"."refund_paid_for_enum_old" AS ENUM('EVENT', 'COUNSELLING', 'COURSE')`);
        await queryRunner.query(`ALTER TABLE "RefundRequests" ALTER COLUMN "paidFor" TYPE "public"."refund_paid_for_enum_old" USING "paidFor"::"text"::"public"."refund_paid_for_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."refund_paid_for_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."refund_paid_for_enum_old" RENAME TO "refund_paid_for_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."Transactions_paid_for_enum_old" AS ENUM('EVENT', 'COUNSELLING', 'COURSE')`);
        await queryRunner.query(`ALTER TABLE "Transactions" ALTER COLUMN "paid_for" TYPE "public"."Transactions_paid_for_enum_old" USING "paid_for"::"text"::"public"."Transactions_paid_for_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."Transactions_paid_for_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."Transactions_paid_for_enum_old" RENAME TO "Transactions_paid_for_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_56048469fcc831362af2268273"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f5ec900b10e0b63ffe766311d1"`);
        await queryRunner.query(`DROP TABLE "UserBookDownloads"`);
        await queryRunner.query(`DROP TABLE "Books"`);
        await queryRunner.query(`DROP TYPE "public"."Books_accesstype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."Books_ownershiptype_enum"`);
    }

}
