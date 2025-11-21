import { MigrationInterface, QueryRunner } from "typeorm";

export class DeletedAt1763723743646 implements MigrationInterface {
    name = 'DeletedAt1763723743646'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Transactions" ADD "deletedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "prayer_comments" ADD "deletedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "prayer_amens" ADD "deletedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "prayers" ADD "deletedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "Users" ADD "deletedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "ChallengeTasks" ADD "deletedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "Challenges" ADD "deletedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "UserChallenges" ADD "deletedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "UserTaskProgress" ADD "deletedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "post_comments" ADD "deletedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "post_likes" ADD "deletedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "post_shares" ADD "deletedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "posts" ADD "deletedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "Badges" ADD "deletedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "UserBadges" ADD "deletedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "nugget_comments" ADD "deletedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "nugget_likes" ADD "deletedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "Admins" ADD "deletedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "nuggets" ADD "deletedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "user_follows" ADD "deletedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "EventRegistrations" ADD "deletedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "Events" ADD "deletedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "ChallengeReflections" ADD "deletedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "post_shares" ALTER COLUMN "createdAt" SET DEFAULT ('now'::text)::timestamp(6) with time zone`);
        await queryRunner.query(`ALTER TABLE "Badges" ALTER COLUMN "createdAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "UserBadges" ALTER COLUMN "createdAt" SET DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "UserBadges" ALTER COLUMN "createdAt" SET DEFAULT ('now'::text)::timestamp(6) with time zone`);
        await queryRunner.query(`ALTER TABLE "Badges" ALTER COLUMN "createdAt" SET DEFAULT ('now'::text)::timestamp(6) with time zone`);
        await queryRunner.query(`ALTER TABLE "post_shares" ALTER COLUMN "createdAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "ChallengeReflections" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "Events" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "EventRegistrations" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "user_follows" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "nuggets" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "Admins" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "nugget_likes" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "nugget_comments" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "UserBadges" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "Badges" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "post_shares" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "post_likes" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "post_comments" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "UserTaskProgress" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "UserChallenges" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "Challenges" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "ChallengeTasks" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "Users" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "prayers" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "prayer_amens" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "prayer_comments" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "Transactions" DROP COLUMN "deletedAt"`);
    }

}
