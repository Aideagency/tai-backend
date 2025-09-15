import { MigrationInterface, QueryRunner } from "typeorm";

export class UserEntity1757960420265 implements MigrationInterface {
    name = 'UserEntity1757960420265'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Users" ALTER COLUMN "last_name" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "Users" ALTER COLUMN "first_name" SET NOT NULL`);
        await queryRunner.query(`ALTER TYPE "public"."Users_user_type_enum" RENAME TO "Users_user_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."Users_user_type_enum" AS ENUM('SINGLE', 'MARRIED', 'PARENT')`);
        await queryRunner.query(`ALTER TABLE "Users" ALTER COLUMN "user_type" TYPE "public"."Users_user_type_enum" USING "user_type"::"text"::"public"."Users_user_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."Users_user_type_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."Users_user_type_enum_old" AS ENUM('Single', 'Married', 'Parent')`);
        await queryRunner.query(`ALTER TABLE "Users" ALTER COLUMN "user_type" TYPE "public"."Users_user_type_enum_old" USING "user_type"::"text"::"public"."Users_user_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."Users_user_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."Users_user_type_enum_old" RENAME TO "Users_user_type_enum"`);
        await queryRunner.query(`ALTER TABLE "Users" ALTER COLUMN "first_name" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "Users" ALTER COLUMN "last_name" DROP NOT NULL`);
    }

}
