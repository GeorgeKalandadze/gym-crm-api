import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserTable1753272347264 implements MigrationInterface {
  name = 'CreateUserTable1753272347264';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."users_status_enum" AS ENUM('active', 'inactive', 'suspended', 'pending')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "firstName" character varying(100) NOT NULL, "lastName" character varying(100) NOT NULL, "email" character varying(255) NOT NULL, "username" character varying(255), "password" character varying(255) NOT NULL, "phone" character varying(20), "dateOfBirth" date, "gender" character varying(10), "bio" text, "organizationId" uuid, "status" "public"."users_status_enum" NOT NULL DEFAULT 'active', "isEmailVerified" boolean NOT NULL DEFAULT false, "emailVerifiedAt" TIMESTAMP, "resetPasswordToken" character varying(255), "resetPasswordExpiresAt" TIMESTAMP, "emailVerificationToken" character varying(255), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_f3d6aea8fcca58182b2e80ce979" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_f3d6aea8fcca58182b2e80ce979"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
  }
}
