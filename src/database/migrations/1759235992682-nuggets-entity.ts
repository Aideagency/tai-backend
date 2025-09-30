import { MigrationInterface, QueryRunner } from "typeorm";

export class NuggetsEntity1759235992682 implements MigrationInterface {
    name = 'NuggetsEntity1759235992682'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "nugget_comments" ("id" SERIAL NOT NULL, "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "createdAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "deleted" boolean NOT NULL DEFAULT false, "suspended" boolean NOT NULL DEFAULT false, "comment" text NOT NULL, "nugget_id" integer, "user_id" integer, "parent_comment_id" integer, CONSTRAINT "PK_8c06180a468b119ae34ffb6f938" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_nugget_comment_nugget_id" ON "nugget_comments" ("nugget_id") `);
        await queryRunner.query(`CREATE INDEX "idx_nugget_comment_user_id" ON "nugget_comments" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "idx_nugget_comment_parent_id" ON "nugget_comments" ("parent_comment_id") `);
        await queryRunner.query(`CREATE TYPE "public"."nugget_likes_reaction_enum" AS ENUM('LIKE', 'LOVE', 'INSPIRED')`);
        await queryRunner.query(`CREATE TABLE "nugget_likes" ("id" SERIAL NOT NULL, "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "createdAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "deleted" boolean NOT NULL DEFAULT false, "suspended" boolean NOT NULL DEFAULT false, "reaction" "public"."nugget_likes_reaction_enum" NOT NULL DEFAULT 'LIKE', "nugget_id" integer, "user_id" integer, CONSTRAINT "uq_nugget_like_user_reaction" UNIQUE ("nugget_id", "user_id", "reaction"), CONSTRAINT "PK_9ea36885e359dde8d9ee9e53028" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_nugget_like_nugget_id" ON "nugget_likes" ("nugget_id") `);
        await queryRunner.query(`CREATE INDEX "idx_nugget_like_user_id" ON "nugget_likes" ("user_id") `);
        await queryRunner.query(`CREATE TYPE "public"."nuggets_community_enum" AS ENUM('SINGLE', 'MARRIED', 'PARENT', 'GENERAL')`);
        await queryRunner.query(`CREATE TABLE "nuggets" ("id" SERIAL NOT NULL, "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "createdAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "deleted" boolean NOT NULL DEFAULT false, "suspended" boolean NOT NULL DEFAULT false, "title" character varying(160), "body" text NOT NULL, "community" "public"."nuggets_community_enum" NOT NULL DEFAULT 'GENERAL', "sourceAttribution" character varying(120), "publishAt" TIMESTAMP, "pushed" boolean NOT NULL DEFAULT false, "isActive" boolean NOT NULL DEFAULT true, "likeCount" integer NOT NULL DEFAULT '0', "commentCount" integer NOT NULL DEFAULT '0', "shareCount" integer NOT NULL DEFAULT '0', "adminId" integer, CONSTRAINT "PK_322561d360be8a7d3134628cacf" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_nugget_publish_at" ON "nuggets" ("publishAt") `);
        await queryRunner.query(`ALTER TABLE "nugget_comments" ADD CONSTRAINT "FK_e6b2dd999dde5d9cba217b51566" FOREIGN KEY ("nugget_id") REFERENCES "nuggets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "nugget_comments" ADD CONSTRAINT "FK_a6cc59ed2a2f1e142f0a3bc7232" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "nugget_comments" ADD CONSTRAINT "FK_d14151578708acc22ca683c4c6a" FOREIGN KEY ("parent_comment_id") REFERENCES "nugget_comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "nugget_likes" ADD CONSTRAINT "FK_14bf20b8f708690556a6e87d1b2" FOREIGN KEY ("nugget_id") REFERENCES "nuggets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "nugget_likes" ADD CONSTRAINT "FK_cb53505489832ce6c9ccd1d613a" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "nuggets" ADD CONSTRAINT "FK_ccda87cbb46d0f250af119db327" FOREIGN KEY ("adminId") REFERENCES "Admins"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "nuggets" DROP CONSTRAINT "FK_ccda87cbb46d0f250af119db327"`);
        await queryRunner.query(`ALTER TABLE "nugget_likes" DROP CONSTRAINT "FK_cb53505489832ce6c9ccd1d613a"`);
        await queryRunner.query(`ALTER TABLE "nugget_likes" DROP CONSTRAINT "FK_14bf20b8f708690556a6e87d1b2"`);
        await queryRunner.query(`ALTER TABLE "nugget_comments" DROP CONSTRAINT "FK_d14151578708acc22ca683c4c6a"`);
        await queryRunner.query(`ALTER TABLE "nugget_comments" DROP CONSTRAINT "FK_a6cc59ed2a2f1e142f0a3bc7232"`);
        await queryRunner.query(`ALTER TABLE "nugget_comments" DROP CONSTRAINT "FK_e6b2dd999dde5d9cba217b51566"`);
        await queryRunner.query(`DROP INDEX "public"."idx_nugget_publish_at"`);
        await queryRunner.query(`DROP TABLE "nuggets"`);
        await queryRunner.query(`DROP TYPE "public"."nuggets_community_enum"`);
        await queryRunner.query(`DROP INDEX "public"."idx_nugget_like_user_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_nugget_like_nugget_id"`);
        await queryRunner.query(`DROP TABLE "nugget_likes"`);
        await queryRunner.query(`DROP TYPE "public"."nugget_likes_reaction_enum"`);
        await queryRunner.query(`DROP INDEX "public"."idx_nugget_comment_parent_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_nugget_comment_user_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_nugget_comment_nugget_id"`);
        await queryRunner.query(`DROP TABLE "nugget_comments"`);
    }

}
