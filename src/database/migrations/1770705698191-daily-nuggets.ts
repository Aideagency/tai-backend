import { MigrationInterface, QueryRunner } from "typeorm";

export class DailyNuggets1770705698191 implements MigrationInterface {
    name = 'DailyNuggets1770705698191'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."nugget_rotation_state_nuggettype_enum" AS ENUM('SINGLE', 'MARRIED', 'PARENT', 'GENERAL')`);
        await queryRunner.query(`CREATE TABLE "nugget_rotation_state" ("id" SERIAL NOT NULL, "nuggetType" "public"."nugget_rotation_state_nuggettype_enum" NOT NULL, "lastNuggetId" integer NOT NULL DEFAULT '0', "lastDateKey" character varying(10), CONSTRAINT "PK_62ce92dfe7b68f1bf7c5278cbde" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "ux_rotation_state_type" ON "nugget_rotation_state" ("nuggetType") `);
        await queryRunner.query(`CREATE TYPE "public"."daily_nuggets_nuggettype_enum" AS ENUM('SINGLE', 'MARRIED', 'PARENT', 'GENERAL')`);
        await queryRunner.query(`CREATE TABLE "daily_nuggets" ("id" SERIAL NOT NULL, "dateKey" character varying(10) NOT NULL, "nuggetType" "public"."daily_nuggets_nuggettype_enum" NOT NULL, "nuggetId" integer NOT NULL, CONSTRAINT "PK_f90c080f5c042fcf93eeb937291" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "ux_daily_nuggets_date_type" ON "daily_nuggets" ("dateKey", "nuggetType") `);
        await queryRunner.query(`CREATE INDEX "idx_nuggets_type_active_id" ON "nuggets" ("nuggetType", "isActive", "id") `);
        await queryRunner.query(`ALTER TABLE "daily_nuggets" ADD CONSTRAINT "FK_cf9d5524866b89e54fe16179ddd" FOREIGN KEY ("nuggetId") REFERENCES "nuggets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "daily_nuggets" DROP CONSTRAINT "FK_cf9d5524866b89e54fe16179ddd"`);
        await queryRunner.query(`DROP INDEX "public"."idx_nuggets_type_active_id"`);
        await queryRunner.query(`DROP INDEX "public"."ux_daily_nuggets_date_type"`);
        await queryRunner.query(`DROP TABLE "daily_nuggets"`);
        await queryRunner.query(`DROP TYPE "public"."daily_nuggets_nuggettype_enum"`);
        await queryRunner.query(`DROP INDEX "public"."ux_rotation_state_type"`);
        await queryRunner.query(`DROP TABLE "nugget_rotation_state"`);
        await queryRunner.query(`DROP TYPE "public"."nugget_rotation_state_nuggettype_enum"`);
    }

}
