import { MigrationInterface, QueryRunner } from "typeorm";

export class AuthEntity1758692529547 implements MigrationInterface {
    name = 'AuthEntity1758692529547'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Users" DROP COLUMN "gender"`);
        await queryRunner.query(`CREATE TYPE "public"."Users_gender_enum" AS ENUM('MALE', 'FEMALE')`);
        await queryRunner.query(`ALTER TABLE "Users" ADD "gender" "public"."Users_gender_enum" NOT NULL`);
        await queryRunner.query(`ALTER TABLE "Users" ALTER COLUMN "birth_date" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "Users" ALTER COLUMN "email_address" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "Users" ADD CONSTRAINT "UQ_83a656147925b3862df74cbbd7d" UNIQUE ("email_address")`);
        await queryRunner.query(`ALTER TABLE "Users" ALTER COLUMN "phone_no" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "Users" ADD CONSTRAINT "UQ_48e04cd7eec10c14d36cb670403" UNIQUE ("phone_no")`);
        await queryRunner.query(`ALTER TABLE "Users" ALTER COLUMN "password" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Users" ALTER COLUMN "password" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "Users" DROP CONSTRAINT "UQ_48e04cd7eec10c14d36cb670403"`);
        await queryRunner.query(`ALTER TABLE "Users" ALTER COLUMN "phone_no" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "Users" DROP CONSTRAINT "UQ_83a656147925b3862df74cbbd7d"`);
        await queryRunner.query(`ALTER TABLE "Users" ALTER COLUMN "email_address" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "Users" ALTER COLUMN "birth_date" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "Users" DROP COLUMN "gender"`);
        await queryRunner.query(`DROP TYPE "public"."Users_gender_enum"`);
        await queryRunner.query(`ALTER TABLE "Users" ADD "gender" character varying`);
    }

}
