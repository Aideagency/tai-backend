import { MigrationInterface, QueryRunner } from "typeorm";

export class AuthEntity1758647065392 implements MigrationInterface {
    name = 'AuthEntity1758647065392'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "Transactions" ("id" SERIAL NOT NULL, "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "createdAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "deleted" boolean NOT NULL DEFAULT false, "suspended" boolean NOT NULL DEFAULT false, "transaction_ref" character varying NOT NULL, "status" character varying NOT NULL DEFAULT 'pending', "comment" character varying, "pay_comment" character varying, "client_id" character varying, "fullName" character varying, "email_address" character varying, "phoneNumber" character varying, "channel" character varying, "product_type" character varying, "amount" numeric(10,2) DEFAULT '0', "charge" numeric(10,2) DEFAULT '0', "actualAmount" numeric(10,2) DEFAULT '0', "transaction_date" TIMESTAMP, "Fincon_date" TIMESTAMP, "currency_code" character varying DEFAULT 'NGN', "product_description" character varying, "hash" character varying, "paystack_id" character varying, "paystack_ref" character varying, "userId" integer, CONSTRAINT "PK_7761bf9766670b894ff2fdb3700" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."Users_marital_status_enum" AS ENUM('SINGLE', 'MARRIED')`);
        await queryRunner.query(`CREATE TABLE "Users" ("id" SERIAL NOT NULL, "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "createdAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "deleted" boolean NOT NULL DEFAULT false, "suspended" boolean NOT NULL DEFAULT false, "last_name" character varying NOT NULL, "first_name" character varying NOT NULL, "middle_name" character varying, "gender" character varying, "birth_date" character varying, "email_address" character varying, "phone_no" character varying, "password" character varying, "marital_status" "public"."Users_marital_status_enum", "is_parent" boolean NOT NULL DEFAULT false, "ResetCode" character varying, "resetTokenExpiration" TIMESTAMP, "is_email_verified" boolean NOT NULL DEFAULT false, "lastLogonDate" TIMESTAMP, "userName" character varying, "profilePicture" text, "rejectedBy" character varying, "refresh_token" character varying, "suspensionReason" text, CONSTRAINT "UQ_b2ee401c9d5288def8a87c559a0" UNIQUE ("userName"), CONSTRAINT "PK_16d4f7d636df336db11d87413e3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "Transactions" ADD CONSTRAINT "FK_f01450fedf7507118ad25dcf41e" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Transactions" DROP CONSTRAINT "FK_f01450fedf7507118ad25dcf41e"`);
        await queryRunner.query(`DROP TABLE "Users"`);
        await queryRunner.query(`DROP TYPE "public"."Users_marital_status_enum"`);
        await queryRunner.query(`DROP TABLE "Transactions"`);
    }

}
