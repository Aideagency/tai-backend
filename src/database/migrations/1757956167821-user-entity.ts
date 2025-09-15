import { MigrationInterface, QueryRunner } from "typeorm";

export class UserEntity1757956167821 implements MigrationInterface {
    name = 'UserEntity1757956167821'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."Users_title_enum" AS ENUM('MR', 'MRS', 'MISS', 'DR', 'PROF', 'REV')`);
        await queryRunner.query(`CREATE TYPE "public"."Users_gender_enum" AS ENUM('Male', 'Female')`);
        await queryRunner.query(`CREATE TYPE "public"."Users_user_type_enum" AS ENUM('Single', 'Married', 'Parent')`);
        await queryRunner.query(`CREATE TABLE "Users" ("id" SERIAL NOT NULL, "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "createdAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "deleted" boolean NOT NULL DEFAULT false, "suspended" boolean NOT NULL DEFAULT false, "title" "public"."Users_title_enum", "last_name" character varying, "first_name" character varying, "middle_name" character varying, "gender" "public"."Users_gender_enum", "marital_status" character varying, "birth_date" character varying, "email_address" character varying, "phone_no" character varying, "password" character varying, "user_type" "public"."Users_user_type_enum" NOT NULL, "ResetCode" character varying, "resetTokenExpiration" TIMESTAMP, "is_email_verified" boolean NOT NULL DEFAULT false, "lastLogonDate" TIMESTAMP, "userName" character varying, "profilePicture" text, "rejectedBy" character varying, "refresh_token" character varying, "suspensionReason" text, CONSTRAINT "UQ_b2ee401c9d5288def8a87c559a0" UNIQUE ("userName"), CONSTRAINT "PK_16d4f7d636df336db11d87413e3" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "Users"`);
        await queryRunner.query(`DROP TYPE "public"."Users_user_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."Users_gender_enum"`);
        await queryRunner.query(`DROP TYPE "public"."Users_title_enum"`);
    }

}
