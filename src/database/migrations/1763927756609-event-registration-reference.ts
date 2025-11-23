import { MigrationInterface, QueryRunner } from "typeorm";

export class EventRegistrationReference1763927756609 implements MigrationInterface {
    name = 'EventRegistrationReference1763927756609'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "EventRegistrations" ADD "transaction_ref" character varying`);
        await queryRunner.query(`ALTER TABLE "Badges" ALTER COLUMN "createdAt" SET DEFAULT ('now'::text)::timestamp(6) with time zone`);
        await queryRunner.query(`ALTER TABLE "UserBadges" ALTER COLUMN "createdAt" SET DEFAULT ('now'::text)::timestamp(6) with time zone`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "UserBadges" ALTER COLUMN "createdAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "Badges" ALTER COLUMN "createdAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "EventRegistrations" DROP COLUMN "transaction_ref"`);
    }

}
