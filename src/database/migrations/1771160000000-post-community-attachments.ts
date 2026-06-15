import { MigrationInterface, QueryRunner } from 'typeorm';

export class PostCommunityAttachments1771160000000
  implements MigrationInterface
{
  name = 'PostCommunityAttachments1771160000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."posts_community_enum" AS ENUM('SINGLE', 'MARRIED', 'PARENT')`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" ADD "community" "public"."posts_community_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."post_attachments_type_enum" AS ENUM('IMAGE', 'VIDEO', 'DOCUMENT', 'LINK', 'OTHER')`,
    );
    await queryRunner.query(
      `CREATE TABLE "post_attachments" ("id" SERIAL NOT NULL, "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), "deletedAt" TIMESTAMP, "deleted" boolean NOT NULL DEFAULT false, "suspended" boolean NOT NULL DEFAULT false, "postId" integer NOT NULL, "type" "public"."post_attachments_type_enum" NOT NULL, "url" character varying(2000) NOT NULL, "title" character varying(255), "publicId" character varying(500), "mimeType" character varying(100), "resourceType" character varying(50), "sizeBytes" bigint, CONSTRAINT "PK_post_attachments_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_post_attachments_post_id" ON "post_attachments" ("postId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_attachments" ADD CONSTRAINT "FK_post_attachments_post_id" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "post_attachments" DROP CONSTRAINT "FK_post_attachments_post_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_post_attachments_post_id"`,
    );
    await queryRunner.query(`DROP TABLE "post_attachments"`);
    await queryRunner.query(`DROP TYPE "public"."post_attachments_type_enum"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "community"`);
    await queryRunner.query(`DROP TYPE "public"."posts_community_enum"`);
  }
}
