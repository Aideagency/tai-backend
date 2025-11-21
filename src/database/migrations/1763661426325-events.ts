import { MigrationInterface, QueryRunner } from "typeorm";

export class Events1763661426325 implements MigrationInterface {
    name = 'Events1763661426325'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."event_registration_status_enum" AS ENUM('PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'REFUNDED')`);
        await queryRunner.query(`CREATE TABLE "EventRegistrations" ("id" SERIAL NOT NULL, "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "createdAt" TIMESTAMP(6) NOT NULL DEFAULT now(), "deleted" boolean NOT NULL DEFAULT false, "suspended" boolean NOT NULL DEFAULT false, "status" "public"."event_registration_status_enum" NOT NULL DEFAULT 'PENDING_PAYMENT', "quantity" integer NOT NULL DEFAULT '1', "unitPrice" numeric(12,2), "paidAt" TIMESTAMP, "cancelledAt" TIMESTAMP, "userId" integer, "eventId" integer, "transactionId" integer, CONSTRAINT "PK_849eb57e54a2585e003415853a9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_88a8ce1237cc41db00d76b9c38" ON "EventRegistrations" ("userId", "eventId") `);
        await queryRunner.query(`CREATE TYPE "public"."Events_type_enum" AS ENUM('COMMUNITY', 'CONFERENCE', 'RETREAT')`);
        await queryRunner.query(`CREATE TYPE "public"."Events_status_enum" AS ENUM('DRAFT', 'PUBLISHED', 'CANCELLED', 'ENDED')`);
        await queryRunner.query(`CREATE TYPE "public"."Events_mode_enum" AS ENUM('ONLINE', 'OFFLINE')`);
        await queryRunner.query(`CREATE TABLE "Events" ("id" SERIAL NOT NULL, "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "createdAt" TIMESTAMP(6) NOT NULL DEFAULT now(), "deleted" boolean NOT NULL DEFAULT false, "suspended" boolean NOT NULL DEFAULT false, "title" character varying NOT NULL, "description" text, "type" "public"."Events_type_enum" NOT NULL, "status" "public"."Events_status_enum" NOT NULL DEFAULT 'PUBLISHED', "mode" "public"."Events_mode_enum" NOT NULL, "locationText" character varying, "locationUrl" character varying, "coverImageUrl" character varying, "startsAt" TIMESTAMP NOT NULL, "endsAt" TIMESTAMP NOT NULL, "capacity" integer, "icsToken" character varying, "price" numeric, "organizerId" integer, CONSTRAINT "UQ_7220e6d399ecd253f00155a3b4d" UNIQUE ("icsToken"), CONSTRAINT "PK_efc6f7ffffa26a4d4fe5f383a0b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_76b3852578992c8d734d9307c6" ON "Events" ("startsAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_dba9ac34c81dd23102f2e486f5" ON "Events" ("type", "status") `);
        await queryRunner.query(`ALTER TABLE "Transactions" DROP COLUMN "pay_comment"`);
        await queryRunner.query(`ALTER TABLE "Transactions" DROP COLUMN "client_id"`);
        await queryRunner.query(`ALTER TABLE "Transactions" DROP COLUMN "fullName"`);
        await queryRunner.query(`ALTER TABLE "Transactions" DROP COLUMN "phoneNumber"`);
        await queryRunner.query(`ALTER TABLE "Transactions" DROP COLUMN "channel"`);
        await queryRunner.query(`ALTER TABLE "Transactions" DROP COLUMN "product_type"`);
        await queryRunner.query(`ALTER TABLE "Transactions" DROP COLUMN "transaction_date"`);
        await queryRunner.query(`ALTER TABLE "Transactions" DROP COLUMN "Fincon_date"`);
        await queryRunner.query(`ALTER TABLE "Transactions" DROP COLUMN "product_description"`);
        await queryRunner.query(`ALTER TABLE "Transactions" DROP COLUMN "paystack_id"`);
        await queryRunner.query(`ALTER TABLE "Transactions" ADD "phone_number" character varying`);
        await queryRunner.query(`CREATE TYPE "public"."Transactions_paid_for_enum" AS ENUM('EVENT', 'COUNSELLING', 'COURSE')`);
        await queryRunner.query(`ALTER TABLE "Transactions" ADD "paid_for" "public"."Transactions_paid_for_enum" NOT NULL`);
        await queryRunner.query(`ALTER TABLE "Transactions" ALTER COLUMN "transaction_ref" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "Transactions" DROP COLUMN "status"`);
        await queryRunner.query(`CREATE TYPE "public"."Transactions_status_enum" AS ENUM('pending', 'success', 'failure', 'abandoned')`);
        await queryRunner.query(`ALTER TABLE "Transactions" ADD "status" "public"."Transactions_status_enum" NOT NULL DEFAULT 'pending'`);
        await queryRunner.query(`ALTER TABLE "post_shares" ALTER COLUMN "createdAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "EventRegistrations" ADD CONSTRAINT "FK_9cd25e01bb36ea34ac9905cd709" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "EventRegistrations" ADD CONSTRAINT "FK_35ffd8c45284793377576397158" FOREIGN KEY ("eventId") REFERENCES "Events"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "EventRegistrations" ADD CONSTRAINT "FK_f6c024c4682505120a6c845643a" FOREIGN KEY ("transactionId") REFERENCES "Transactions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Events" ADD CONSTRAINT "FK_787aada0579ee53af874be33c4a" FOREIGN KEY ("organizerId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Events" DROP CONSTRAINT "FK_787aada0579ee53af874be33c4a"`);
        await queryRunner.query(`ALTER TABLE "EventRegistrations" DROP CONSTRAINT "FK_f6c024c4682505120a6c845643a"`);
        await queryRunner.query(`ALTER TABLE "EventRegistrations" DROP CONSTRAINT "FK_35ffd8c45284793377576397158"`);
        await queryRunner.query(`ALTER TABLE "EventRegistrations" DROP CONSTRAINT "FK_9cd25e01bb36ea34ac9905cd709"`);
        await queryRunner.query(`ALTER TABLE "post_shares" ALTER COLUMN "createdAt" SET DEFAULT ('now'::text)::timestamp(6) with time zone`);
        await queryRunner.query(`ALTER TABLE "Transactions" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."Transactions_status_enum"`);
        await queryRunner.query(`ALTER TABLE "Transactions" ADD "status" character varying NOT NULL DEFAULT 'pending'`);
        await queryRunner.query(`ALTER TABLE "Transactions" ALTER COLUMN "transaction_ref" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "Transactions" DROP COLUMN "paid_for"`);
        await queryRunner.query(`DROP TYPE "public"."Transactions_paid_for_enum"`);
        await queryRunner.query(`ALTER TABLE "Transactions" DROP COLUMN "phone_number"`);
        await queryRunner.query(`ALTER TABLE "Transactions" ADD "paystack_id" character varying`);
        await queryRunner.query(`ALTER TABLE "Transactions" ADD "product_description" character varying`);
        await queryRunner.query(`ALTER TABLE "Transactions" ADD "Fincon_date" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "Transactions" ADD "transaction_date" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "Transactions" ADD "product_type" character varying`);
        await queryRunner.query(`ALTER TABLE "Transactions" ADD "channel" character varying`);
        await queryRunner.query(`ALTER TABLE "Transactions" ADD "phoneNumber" character varying`);
        await queryRunner.query(`ALTER TABLE "Transactions" ADD "fullName" character varying`);
        await queryRunner.query(`ALTER TABLE "Transactions" ADD "client_id" character varying`);
        await queryRunner.query(`ALTER TABLE "Transactions" ADD "pay_comment" character varying`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dba9ac34c81dd23102f2e486f5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_76b3852578992c8d734d9307c6"`);
        await queryRunner.query(`DROP TABLE "Events"`);
        await queryRunner.query(`DROP TYPE "public"."Events_mode_enum"`);
        await queryRunner.query(`DROP TYPE "public"."Events_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."Events_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_88a8ce1237cc41db00d76b9c38"`);
        await queryRunner.query(`DROP TABLE "EventRegistrations"`);
        await queryRunner.query(`DROP TYPE "public"."event_registration_status_enum"`);
    }

}
