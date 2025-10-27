import { MigrationInterface, QueryRunner } from "typeorm";

export class Connections1761560762248 implements MigrationInterface {
    name = 'Connections1761560762248'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."user_follows_status_enum" AS ENUM('ACCEPTED', 'PENDING', 'BLOCKED')`);
        await queryRunner.query(`CREATE TABLE "user_follows" ("id" SERIAL NOT NULL, "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "createdAt" TIMESTAMP(6) NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "deleted" boolean NOT NULL DEFAULT false, "suspended" boolean NOT NULL DEFAULT false, "status" "public"."user_follows_status_enum" NOT NULL DEFAULT 'ACCEPTED', "isDeleted" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "follower_id" integer, "followee_id" integer, CONSTRAINT "PK_da8e8793113adf3015952880966" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_b340188b3e87d36026b99939c0" ON "user_follows" ("created_at") `);
        await queryRunner.query(`ALTER TABLE "ChallengeTasks" ALTER COLUMN "dayNumber" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_follows" ADD CONSTRAINT "FK_f7af3bf8f2dcba61b4adc108239" FOREIGN KEY ("follower_id") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_follows" ADD CONSTRAINT "FK_ad9563c49281be94000f50a4308" FOREIGN KEY ("followee_id") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_follows" DROP CONSTRAINT "FK_ad9563c49281be94000f50a4308"`);
        await queryRunner.query(`ALTER TABLE "user_follows" DROP CONSTRAINT "FK_f7af3bf8f2dcba61b4adc108239"`);
        await queryRunner.query(`ALTER TABLE "ChallengeTasks" ALTER COLUMN "dayNumber" SET NOT NULL`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b340188b3e87d36026b99939c0"`);
        await queryRunner.query(`DROP TABLE "user_follows"`);
        await queryRunner.query(`DROP TYPE "public"."user_follows_status_enum"`);
    }

}
