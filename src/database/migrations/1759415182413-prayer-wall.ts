import { MigrationInterface, QueryRunner } from "typeorm";

export class PrayerWall1759415182413 implements MigrationInterface {
    name = 'PrayerWall1759415182413'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "prayer_comments" ("id" SERIAL NOT NULL, "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "createdAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "deleted" boolean NOT NULL DEFAULT false, "suspended" boolean NOT NULL DEFAULT false, "comment" text NOT NULL, "isVisible" boolean NOT NULL DEFAULT true, "prayer_id" integer, "user_id" integer, "parent_comment_id" integer, CONSTRAINT "PK_505a94cb9763d7fd245249cc54c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_prayer_comment_prayer_id" ON "prayer_comments" ("prayer_id") `);
        await queryRunner.query(`CREATE INDEX "idx_prayer_comment_user_id" ON "prayer_comments" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "idx_prayer_comment_parent_id" ON "prayer_comments" ("parent_comment_id") `);
        await queryRunner.query(`CREATE INDEX "idx_prayer_comment_created_at" ON "prayer_comments" ("createdAt") `);
        await queryRunner.query(`CREATE TYPE "public"."prayer_amens_reaction_enum" AS ENUM('AMEN', 'STRONG_AMEN')`);
        await queryRunner.query(`CREATE TABLE "prayer_amens" ("id" SERIAL NOT NULL, "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "createdAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "deleted" boolean NOT NULL DEFAULT false, "suspended" boolean NOT NULL DEFAULT false, "reaction" "public"."prayer_amens_reaction_enum" NOT NULL DEFAULT 'AMEN', "prayer_id" integer, "user_id" integer, CONSTRAINT "uq_prayer_user" UNIQUE ("prayer_id", "user_id"), CONSTRAINT "PK_19ee26d378d211e0775fbe592a0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_prayer_amen_prayer_id" ON "prayer_amens" ("prayer_id") `);
        await queryRunner.query(`CREATE INDEX "idx_prayer_amen_user_id" ON "prayer_amens" ("user_id") `);
        await queryRunner.query(`CREATE TABLE "prayers" ("id" SERIAL NOT NULL, "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "createdAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "deleted" boolean NOT NULL DEFAULT false, "suspended" boolean NOT NULL DEFAULT false, "title" character varying(160), "body" text NOT NULL, "sourceAttribution" character varying(120), "isVisible" boolean NOT NULL DEFAULT true, "isAnswered" boolean NOT NULL DEFAULT false, "answeredAt" TIMESTAMP, "isAnonymous" boolean NOT NULL DEFAULT false, "amenCount" integer NOT NULL DEFAULT '0', "commentCount" integer NOT NULL DEFAULT '0', "shareCount" integer NOT NULL DEFAULT '0', "reportedCount" integer NOT NULL DEFAULT '0', "lastActivityAt" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer, CONSTRAINT "PK_e999e971b29faf22932664580ee" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_prayers_user_id" ON "prayers" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "idx_prayers_last_activity" ON "prayers" ("lastActivityAt") `);
        await queryRunner.query(`CREATE INDEX "idx_prayers_created_at" ON "prayers" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "idx_prayers_is_visible" ON "prayers" ("isVisible") `);
        await queryRunner.query(`ALTER TABLE "prayer_comments" ADD CONSTRAINT "FK_5d50276e9e00244f55af8c5d2ab" FOREIGN KEY ("prayer_id") REFERENCES "prayers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "prayer_comments" ADD CONSTRAINT "FK_93551f53bd7186b0bc71c4da711" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "prayer_comments" ADD CONSTRAINT "FK_c6940377af78213f230fa538800" FOREIGN KEY ("parent_comment_id") REFERENCES "prayer_comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "prayer_amens" ADD CONSTRAINT "FK_4cf6f2ddd237a9b2c7fcd11e8ea" FOREIGN KEY ("prayer_id") REFERENCES "prayers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "prayer_amens" ADD CONSTRAINT "FK_ecbaba6212e16d9282f2097a275" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "prayers" ADD CONSTRAINT "FK_25a96949638aac5ecc471e58aac" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "prayers" DROP CONSTRAINT "FK_25a96949638aac5ecc471e58aac"`);
        await queryRunner.query(`ALTER TABLE "prayer_amens" DROP CONSTRAINT "FK_ecbaba6212e16d9282f2097a275"`);
        await queryRunner.query(`ALTER TABLE "prayer_amens" DROP CONSTRAINT "FK_4cf6f2ddd237a9b2c7fcd11e8ea"`);
        await queryRunner.query(`ALTER TABLE "prayer_comments" DROP CONSTRAINT "FK_c6940377af78213f230fa538800"`);
        await queryRunner.query(`ALTER TABLE "prayer_comments" DROP CONSTRAINT "FK_93551f53bd7186b0bc71c4da711"`);
        await queryRunner.query(`ALTER TABLE "prayer_comments" DROP CONSTRAINT "FK_5d50276e9e00244f55af8c5d2ab"`);
        await queryRunner.query(`DROP INDEX "public"."idx_prayers_is_visible"`);
        await queryRunner.query(`DROP INDEX "public"."idx_prayers_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."idx_prayers_last_activity"`);
        await queryRunner.query(`DROP INDEX "public"."idx_prayers_user_id"`);
        await queryRunner.query(`DROP TABLE "prayers"`);
        await queryRunner.query(`DROP INDEX "public"."idx_prayer_amen_user_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_prayer_amen_prayer_id"`);
        await queryRunner.query(`DROP TABLE "prayer_amens"`);
        await queryRunner.query(`DROP TYPE "public"."prayer_amens_reaction_enum"`);
        await queryRunner.query(`DROP INDEX "public"."idx_prayer_comment_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."idx_prayer_comment_parent_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_prayer_comment_user_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_prayer_comment_prayer_id"`);
        await queryRunner.query(`DROP TABLE "prayer_comments"`);
    }

}
