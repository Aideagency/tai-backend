import { MigrationInterface, QueryRunner } from 'typeorm';

export class FollowRequestsDefaultPending1771250000000
  implements MigrationInterface
{
  name = 'FollowRequestsDefaultPending1771250000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_follows" ALTER COLUMN "status" SET DEFAULT 'PENDING'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_follows" ALTER COLUMN "status" SET DEFAULT 'ACCEPTED'`,
    );
  }
}
