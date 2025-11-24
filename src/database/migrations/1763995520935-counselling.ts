import { MigrationInterface, QueryRunner } from "typeorm";

export class Counselling1763995520935 implements MigrationInterface {
    name = 'Counselling1763995520935'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."CounsellingBookings_status_enum" AS ENUM('PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW', 'REFUNDED')`);
        await queryRunner.query(`CREATE TABLE "CounsellingBookings" ("id" SERIAL NOT NULL, "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "createdAt" TIMESTAMP(6) NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "deleted" boolean NOT NULL DEFAULT false, "suspended" boolean NOT NULL DEFAULT false, "startsAt" TIMESTAMP NOT NULL, "endsAt" TIMESTAMP, "durationMinutes" integer NOT NULL, "priceAtBooking" numeric NOT NULL, "status" "public"."CounsellingBookings_status_enum" NOT NULL DEFAULT 'PENDING_PAYMENT', "meetingLink" character varying, "locationText" character varying, "reference" character varying, "clientNotes" text, "counsellorNotes" text, "attended" boolean NOT NULL DEFAULT false, "paidAt" TIMESTAMP, "transaction_ref" character varying, "userId" integer, "counsellingId" integer, "counsellorId" integer, CONSTRAINT "UQ_8483f2a3de260be094fa10a68a0" UNIQUE ("reference"), CONSTRAINT "PK_f223f100f170ce9d529d0b4d940" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_b2cee2b693dd857875fb8923a0" ON "CounsellingBookings" ("startsAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_26e2feb72ca164892e984daf4e" ON "CounsellingBookings" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_40f46d82a127e7439c85f21c7d" ON "CounsellingBookings" ("userId", "counsellingId") `);
        await queryRunner.query(`CREATE TYPE "public"."Counsellings_mode_enum" AS ENUM('ONLINE', 'OFFLINE')`);
        await queryRunner.query(`CREATE TYPE "public"."Counsellings_status_enum" AS ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED')`);
        await queryRunner.query(`CREATE TYPE "public"."Counsellings_type_enum" AS ENUM('INDIVIDUAL', 'COUPLES', 'FAMILY', 'GROUP')`);
        await queryRunner.query(`CREATE TABLE "Counsellings" ("id" SERIAL NOT NULL, "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "createdAt" TIMESTAMP(6) NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "deleted" boolean NOT NULL DEFAULT false, "suspended" boolean NOT NULL DEFAULT false, "title" character varying NOT NULL, "description" text, "durationMinutes" integer NOT NULL, "mode" "public"."Counsellings_mode_enum" NOT NULL, "status" "public"."Counsellings_status_enum" NOT NULL DEFAULT 'PUBLISHED', "type" "public"."Counsellings_type_enum" NOT NULL DEFAULT 'INDIVIDUAL', "coverUrl" character varying, "price" numeric, "whatYouGet" text, "whoItsFor" text, "howItWorks" text, "counsellorNotes" text, "maxClientsPerSession" integer, "isActive" boolean NOT NULL DEFAULT true, "isFeatured" boolean NOT NULL DEFAULT false, "counsellorId" integer, CONSTRAINT "PK_08462a5793be871c74d85e13d7e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9aaea653f378930280d4c4adfb" ON "Counsellings" ("type") `);
        await queryRunner.query(`CREATE INDEX "IDX_4a84583a29ffcc0855944cada3" ON "Counsellings" ("status", "mode") `);
        await queryRunner.query(`ALTER TABLE "CounsellingBookings" ADD CONSTRAINT "FK_e48a92d35bdd1a3d0779074eb47" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "CounsellingBookings" ADD CONSTRAINT "FK_c3c05cf1c0080d01c44d9114468" FOREIGN KEY ("counsellingId") REFERENCES "Counsellings"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "CounsellingBookings" ADD CONSTRAINT "FK_937e98080174321bc9a8b612e29" FOREIGN KEY ("counsellorId") REFERENCES "Admins"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Counsellings" ADD CONSTRAINT "FK_ea3ce3a9b99000e33d5e55ab14f" FOREIGN KEY ("counsellorId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Counsellings" DROP CONSTRAINT "FK_ea3ce3a9b99000e33d5e55ab14f"`);
        await queryRunner.query(`ALTER TABLE "CounsellingBookings" DROP CONSTRAINT "FK_937e98080174321bc9a8b612e29"`);
        await queryRunner.query(`ALTER TABLE "CounsellingBookings" DROP CONSTRAINT "FK_c3c05cf1c0080d01c44d9114468"`);
        await queryRunner.query(`ALTER TABLE "CounsellingBookings" DROP CONSTRAINT "FK_e48a92d35bdd1a3d0779074eb47"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4a84583a29ffcc0855944cada3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9aaea653f378930280d4c4adfb"`);
        await queryRunner.query(`DROP TABLE "Counsellings"`);
        await queryRunner.query(`DROP TYPE "public"."Counsellings_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."Counsellings_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."Counsellings_mode_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_40f46d82a127e7439c85f21c7d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_26e2feb72ca164892e984daf4e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b2cee2b693dd857875fb8923a0"`);
        await queryRunner.query(`DROP TABLE "CounsellingBookings"`);
        await queryRunner.query(`DROP TYPE "public"."CounsellingBookings_status_enum"`);
    }

}
