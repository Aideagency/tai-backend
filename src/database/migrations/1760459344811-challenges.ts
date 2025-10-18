import { MigrationInterface, QueryRunner } from "typeorm";

export class Challenges1760459344811 implements MigrationInterface {
    name = 'Challenges1760459344811'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."ChallengeTasks_cadence_enum" AS ENUM('DAILY', 'WEEKLY')`);
        await queryRunner.query(`CREATE TABLE "ChallengeTasks" ("id" SERIAL NOT NULL, "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "createdAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "deleted" boolean NOT NULL DEFAULT false, "suspended" boolean NOT NULL DEFAULT false, "cadence" "public"."ChallengeTasks_cadence_enum" NOT NULL DEFAULT 'DAILY', "dayNumber" integer NOT NULL, "weekNumber" integer, "title" character varying NOT NULL, "instructions" text, "isMilestone" boolean NOT NULL DEFAULT false, "challengeId" integer, CONSTRAINT "PK_b9e95b2f52e8bb49a37ccb0ef3c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_da6edc7fb6ce04a1591331abfb" ON "ChallengeTasks" ("challengeId") `);
        await queryRunner.query(`CREATE TYPE "public"."Challenges_community_enum" AS ENUM('SINGLE', 'MARRIED', 'PARENT')`);
        await queryRunner.query(`CREATE TYPE "public"."Challenges_frequency_enum" AS ENUM('DAILY', 'WEEKLY', 'MIXED')`);
        await queryRunner.query(`CREATE TYPE "public"."Challenges_visibility_enum" AS ENUM('PUBLIC', 'COMMUNITY_ONLY')`);
        await queryRunner.query(`CREATE TYPE "public"."Challenges_status_enum" AS ENUM('DRAFT', 'ACTIVE', 'ARCHIVED')`);
        await queryRunner.query(`CREATE TABLE "Challenges" ("id" SERIAL NOT NULL, "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "createdAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "deleted" boolean NOT NULL DEFAULT false, "suspended" boolean NOT NULL DEFAULT false, "title" character varying NOT NULL, "community" "public"."Challenges_community_enum" NOT NULL, "durationDays" integer NOT NULL, "frequency" "public"."Challenges_frequency_enum" NOT NULL DEFAULT 'DAILY', "visibility" "public"."Challenges_visibility_enum" NOT NULL DEFAULT 'COMMUNITY_ONLY', "coverImageUrl" character varying, "description" text, "bookTitle" character varying, "bookAuthor" character varying, "status" "public"."Challenges_status_enum" NOT NULL DEFAULT 'DRAFT', "requireDualConfirmation" boolean NOT NULL DEFAULT false, "completionBadgeCode" character varying, CONSTRAINT "PK_849dae8b4a81ce77bd9cd89741a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_b363ac79f844603c4ecfb964d9" ON "Challenges" ("title") `);
        await queryRunner.query(`CREATE TABLE "UserTaskProgress" ("id" SERIAL NOT NULL, "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "createdAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "deleted" boolean NOT NULL DEFAULT false, "suspended" boolean NOT NULL DEFAULT false, "completedByUser" boolean NOT NULL DEFAULT false, "completedAt" TIMESTAMP, "confirmedByPartner" boolean NOT NULL DEFAULT false, "partnerUserId" character varying, "confirmedAt" TIMESTAMP, "userChallengeId" integer, "taskId" integer, CONSTRAINT "PK_8df8abed0cb58ccebad303bd5b5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_98b1f78ec350bd9cab8cbcfb5b" ON "UserTaskProgress" ("userChallengeId", "taskId") `);
        await queryRunner.query(`CREATE TABLE "UserChallenges" ("id" SERIAL NOT NULL, "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "createdAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "deleted" boolean NOT NULL DEFAULT false, "suspended" boolean NOT NULL DEFAULT false, "startDate" TIMESTAMP, "endDate" TIMESTAMP, "streakCount" integer NOT NULL DEFAULT '0', "progressPercent" integer NOT NULL DEFAULT '0', "lastCheckInAt" TIMESTAMP, "isCompleted" boolean NOT NULL DEFAULT false, "isArchived" boolean NOT NULL DEFAULT false, "userId" integer, "challengeId" integer, CONSTRAINT "PK_a485894ee1209cbb67a629d70c1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_51e41d4e6713142e1589f859f8" ON "UserChallenges" ("userId", "challengeId") `);
        await queryRunner.query(`CREATE TABLE "Badges" ("id" SERIAL NOT NULL, "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "createdAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "deleted" boolean NOT NULL DEFAULT false, "suspended" boolean NOT NULL DEFAULT false, "code" character varying, "name" character varying NOT NULL, "description" text, "iconUrl" character varying, CONSTRAINT "UQ_8348af2fdd47ff0fe97ab704f51" UNIQUE ("code"), CONSTRAINT "PK_1003fe1bcfbe3e128ad9daefba2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "UserBadges" ("id" SERIAL NOT NULL, "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "createdAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "deleted" boolean NOT NULL DEFAULT false, "suspended" boolean NOT NULL DEFAULT false, "awardedAt" TIMESTAMP, "awardedForChallengeId" character varying, "userId" integer, "badgeId" integer, CONSTRAINT "PK_9eeec7e3b1e7d79a18b97483f80" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_7aca27064e9a12cebda5ad8651" ON "UserBadges" ("userId", "badgeId") `);
        await queryRunner.query(`CREATE TABLE "ChallengeReflections" ("id" SERIAL NOT NULL, "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "createdAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "deleted" boolean NOT NULL DEFAULT false, "suspended" boolean NOT NULL DEFAULT false, "weekNumber" integer, "content" text NOT NULL, "likesCount" integer NOT NULL DEFAULT '0', "isPinned" boolean NOT NULL DEFAULT false, "challengeId" integer, "userId" integer, CONSTRAINT "PK_7736f5b4af384eb7a409af9eaa2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_e29403449208b297c39bb42241" ON "ChallengeReflections" ("challengeId") `);
        await queryRunner.query(`CREATE INDEX "IDX_e9ca2365f532d6ef051fe25a42" ON "ChallengeReflections" ("userId") `);
        await queryRunner.query(`ALTER TABLE "ChallengeTasks" ADD CONSTRAINT "FK_da6edc7fb6ce04a1591331abfbd" FOREIGN KEY ("challengeId") REFERENCES "Challenges"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "UserTaskProgress" ADD CONSTRAINT "FK_f1f9aac6c268a9c1a9b7866c76c" FOREIGN KEY ("userChallengeId") REFERENCES "UserChallenges"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "UserTaskProgress" ADD CONSTRAINT "FK_3d199fec9f5b0fc69f16856c2fd" FOREIGN KEY ("taskId") REFERENCES "ChallengeTasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "UserChallenges" ADD CONSTRAINT "FK_681341311bbaede188ae732e845" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "UserChallenges" ADD CONSTRAINT "FK_d43e3b151955547925ab5c34a16" FOREIGN KEY ("challengeId") REFERENCES "Challenges"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "UserBadges" ADD CONSTRAINT "FK_a1223f6c26bb6fd2c76c7d3172a" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "UserBadges" ADD CONSTRAINT "FK_02279ab973308e5562393e99779" FOREIGN KEY ("badgeId") REFERENCES "Badges"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ChallengeReflections" ADD CONSTRAINT "FK_e29403449208b297c39bb422414" FOREIGN KEY ("challengeId") REFERENCES "Challenges"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ChallengeReflections" ADD CONSTRAINT "FK_e9ca2365f532d6ef051fe25a42e" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ChallengeReflections" DROP CONSTRAINT "FK_e9ca2365f532d6ef051fe25a42e"`);
        await queryRunner.query(`ALTER TABLE "ChallengeReflections" DROP CONSTRAINT "FK_e29403449208b297c39bb422414"`);
        await queryRunner.query(`ALTER TABLE "UserBadges" DROP CONSTRAINT "FK_02279ab973308e5562393e99779"`);
        await queryRunner.query(`ALTER TABLE "UserBadges" DROP CONSTRAINT "FK_a1223f6c26bb6fd2c76c7d3172a"`);
        await queryRunner.query(`ALTER TABLE "UserChallenges" DROP CONSTRAINT "FK_d43e3b151955547925ab5c34a16"`);
        await queryRunner.query(`ALTER TABLE "UserChallenges" DROP CONSTRAINT "FK_681341311bbaede188ae732e845"`);
        await queryRunner.query(`ALTER TABLE "UserTaskProgress" DROP CONSTRAINT "FK_3d199fec9f5b0fc69f16856c2fd"`);
        await queryRunner.query(`ALTER TABLE "UserTaskProgress" DROP CONSTRAINT "FK_f1f9aac6c268a9c1a9b7866c76c"`);
        await queryRunner.query(`ALTER TABLE "ChallengeTasks" DROP CONSTRAINT "FK_da6edc7fb6ce04a1591331abfbd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e9ca2365f532d6ef051fe25a42"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e29403449208b297c39bb42241"`);
        await queryRunner.query(`DROP TABLE "ChallengeReflections"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7aca27064e9a12cebda5ad8651"`);
        await queryRunner.query(`DROP TABLE "UserBadges"`);
        await queryRunner.query(`DROP TABLE "Badges"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_51e41d4e6713142e1589f859f8"`);
        await queryRunner.query(`DROP TABLE "UserChallenges"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_98b1f78ec350bd9cab8cbcfb5b"`);
        await queryRunner.query(`DROP TABLE "UserTaskProgress"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b363ac79f844603c4ecfb964d9"`);
        await queryRunner.query(`DROP TABLE "Challenges"`);
        await queryRunner.query(`DROP TYPE "public"."Challenges_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."Challenges_visibility_enum"`);
        await queryRunner.query(`DROP TYPE "public"."Challenges_frequency_enum"`);
        await queryRunner.query(`DROP TYPE "public"."Challenges_community_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_da6edc7fb6ce04a1591331abfb"`);
        await queryRunner.query(`DROP TABLE "ChallengeTasks"`);
        await queryRunner.query(`DROP TYPE "public"."ChallengeTasks_cadence_enum"`);
    }

}
