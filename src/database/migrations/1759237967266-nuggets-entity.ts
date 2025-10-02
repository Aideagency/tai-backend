import { MigrationInterface, QueryRunner } from "typeorm";

export class NuggetsEntity1759237967266 implements MigrationInterface {
    name = 'NuggetsEntity1759237967266'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "nuggets" RENAME COLUMN "community" TO "nuggetType"`);
        await queryRunner.query(`ALTER TYPE "public"."nuggets_community_enum" RENAME TO "nuggets_nuggettype_enum"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."nuggets_nuggettype_enum" RENAME TO "nuggets_community_enum"`);
        await queryRunner.query(`ALTER TABLE "nuggets" RENAME COLUMN "nuggetType" TO "community"`);
    }

}
