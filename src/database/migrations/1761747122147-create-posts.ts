import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePosts1761747122147 implements MigrationInterface {
    name = 'CreatePosts1761747122147'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "post_comments" ("id" SERIAL NOT NULL, "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "createdAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "deleted" boolean NOT NULL DEFAULT false, "suspended" boolean NOT NULL DEFAULT false, "body" text NOT NULL, "userId" integer NOT NULL, "postId" integer NOT NULL, CONSTRAINT "PK_2e99e04b4a1b31de6f833c18ced" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "post_likes" ("id" SERIAL NOT NULL, "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "createdAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "deleted" boolean NOT NULL DEFAULT false, "suspended" boolean NOT NULL DEFAULT false, "userId" integer NOT NULL, "postId" integer NOT NULL, CONSTRAINT "PK_e4ac7cb9daf243939c6eabb2e0d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "post_shares" ("id" SERIAL NOT NULL, "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "createdAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "deleted" boolean NOT NULL DEFAULT false, "suspended" boolean NOT NULL DEFAULT false, "userId" integer NOT NULL, "postId" integer NOT NULL, CONSTRAINT "PK_41290cd17ae407e8d73aaa4fa93" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "posts" ("id" SERIAL NOT NULL, "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "createdAt" TIMESTAMP(6) NOT NULL DEFAULT now(), "deleted" boolean NOT NULL DEFAULT false, "suspended" boolean NOT NULL DEFAULT false, "title" character varying(255), "body" text NOT NULL, "link" character varying(512), "publishAt" TIMESTAMP, "isActive" boolean NOT NULL DEFAULT true, "likeCount" integer NOT NULL DEFAULT '0', "commentCount" integer NOT NULL DEFAULT '0', "shareCount" integer NOT NULL DEFAULT '0', "userId" integer NOT NULL, CONSTRAINT "PK_2829ac61eff60fcec60d7274b9e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_post_publish_at" ON "posts" ("publishAt") `);
        await queryRunner.query(`ALTER TABLE "nugget_comments" ALTER COLUMN "createdAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "nugget_likes" ALTER COLUMN "createdAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "Admins" ALTER COLUMN "createdAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "nuggets" ALTER COLUMN "createdAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "user_follows" ALTER COLUMN "createdAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "ChallengeReflections" ALTER COLUMN "createdAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "post_comments" ADD CONSTRAINT "FK_62817b3571ec31e552a3cae4e1c" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "post_comments" ADD CONSTRAINT "FK_ac65d744abc05279aee0b290857" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "post_likes" ADD CONSTRAINT "FK_37d337ad54b1aa6b9a44415a498" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "post_likes" ADD CONSTRAINT "FK_6999d13aca25e33515210abaf16" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "post_shares" ADD CONSTRAINT "FK_0c802b35b3e81c1c9a210b134c4" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "post_shares" ADD CONSTRAINT "FK_0cf5df17d5dac2d43ac01817e94" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_ae05faaa55c866130abef6e1fee" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_ae05faaa55c866130abef6e1fee"`);
        await queryRunner.query(`ALTER TABLE "post_shares" DROP CONSTRAINT "FK_0cf5df17d5dac2d43ac01817e94"`);
        await queryRunner.query(`ALTER TABLE "post_shares" DROP CONSTRAINT "FK_0c802b35b3e81c1c9a210b134c4"`);
        await queryRunner.query(`ALTER TABLE "post_likes" DROP CONSTRAINT "FK_6999d13aca25e33515210abaf16"`);
        await queryRunner.query(`ALTER TABLE "post_likes" DROP CONSTRAINT "FK_37d337ad54b1aa6b9a44415a498"`);
        await queryRunner.query(`ALTER TABLE "post_comments" DROP CONSTRAINT "FK_ac65d744abc05279aee0b290857"`);
        await queryRunner.query(`ALTER TABLE "post_comments" DROP CONSTRAINT "FK_62817b3571ec31e552a3cae4e1c"`);
        await queryRunner.query(`ALTER TABLE "ChallengeReflections" ALTER COLUMN "createdAt" SET DEFAULT ('now'::text)::timestamp(6) with time zone`);
        await queryRunner.query(`ALTER TABLE "user_follows" ALTER COLUMN "createdAt" SET DEFAULT ('now'::text)::timestamp(6) with time zone`);
        await queryRunner.query(`ALTER TABLE "nuggets" ALTER COLUMN "createdAt" SET DEFAULT ('now'::text)::timestamp(6) with time zone`);
        await queryRunner.query(`ALTER TABLE "Admins" ALTER COLUMN "createdAt" SET DEFAULT ('now'::text)::timestamp(6) with time zone`);
        await queryRunner.query(`ALTER TABLE "nugget_likes" ALTER COLUMN "createdAt" SET DEFAULT ('now'::text)::timestamp(6) with time zone`);
        await queryRunner.query(`ALTER TABLE "nugget_comments" ALTER COLUMN "createdAt" SET DEFAULT ('now'::text)::timestamp(6) with time zone`);
        await queryRunner.query(`DROP INDEX "public"."idx_post_publish_at"`);
        await queryRunner.query(`DROP TABLE "posts"`);
        await queryRunner.query(`DROP TABLE "post_shares"`);
        await queryRunner.query(`DROP TABLE "post_likes"`);
        await queryRunner.query(`DROP TABLE "post_comments"`);
    }

}
