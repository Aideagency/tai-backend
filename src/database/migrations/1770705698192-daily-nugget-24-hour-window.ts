import { MigrationInterface, QueryRunner } from 'typeorm';

export class DailyNugget24HourWindow1770705698192
  implements MigrationInterface
{
  name = 'DailyNugget24HourWindow1770705698192';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "daily_nuggets" ADD "assignedAt" TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_nuggets" ADD "expiresAt" TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `UPDATE "daily_nuggets" SET "assignedAt" = ("dateKey"::date)::timestamp, "expiresAt" = (("dateKey"::date)::timestamp + interval '24 hours')`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_nuggets" ALTER COLUMN "assignedAt" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_nuggets" ALTER COLUMN "expiresAt" SET NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_daily_nuggets_type_expires_at" ON "daily_nuggets" ("nuggetType", "expiresAt")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."idx_daily_nuggets_type_expires_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_nuggets" DROP COLUMN "expiresAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_nuggets" DROP COLUMN "assignedAt"`,
    );
  }
}
