import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrganizationTable1753268811980
  implements MigrationInterface
{
  name = 'CreateOrganizationTable1753268811980';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."organizations_status_enum" AS ENUM('active', 'inactive', 'suspended')`,
    );
    await queryRunner.query(
      `CREATE TABLE "organizations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "slug" character varying(255) NOT NULL, "description" text, "status" "public"."organizations_status_enum" NOT NULL DEFAULT 'active', "subscriptionExpiresAt" TIMESTAMP, "email" character varying(255), "phone" character varying(20), "website" character varying(255), "address" text, "city" character varying(100), "postalCode" character varying(20), "country" character varying(100), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "UQ_963693341bd612aa01ddf3a4b68" UNIQUE ("slug"), CONSTRAINT "PK_6b031fcd0863e3f6b44230163f9" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "organizations"`);
    await queryRunner.query(`DROP TYPE "public"."organizations_status_enum"`);
  }
}
