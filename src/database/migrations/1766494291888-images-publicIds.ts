import { MigrationInterface, QueryRunner } from "typeorm";

export class ImagesPublicIds1766494291888 implements MigrationInterface {
    name = 'ImagesPublicIds1766494291888'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Challenges" ADD "coverUrlPublicId" character varying`);
        await queryRunner.query(`ALTER TABLE "Events" ADD "coverUrlPublicId" character varying`);
        await queryRunner.query(`ALTER TABLE "Counsellings" ADD "coverUrlPublicId" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Counsellings" DROP COLUMN "coverUrlPublicId"`);
        await queryRunner.query(`ALTER TABLE "Events" DROP COLUMN "coverUrlPublicId"`);
        await queryRunner.query(`ALTER TABLE "Challenges" DROP COLUMN "coverUrlPublicId"`);
    }

}
