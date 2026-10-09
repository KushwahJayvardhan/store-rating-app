import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersStoresRatings1710000000000 implements MigrationInterface {
  name = 'CreateUsersStoresRatings1710000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    await queryRunner.query(`
      CREATE TYPE "user_role_enum" AS ENUM ('ADMIN', 'USER', 'STORE_OWNER');
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" varchar(60) NOT NULL,
        "email" varchar(255) NOT NULL,
        "password_hash" varchar(255) NOT NULL,
        "address" varchar(400) NOT NULL,
        "role" "user_role_enum" NOT NULL DEFAULT 'USER',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_USERS_ROLE" ON "users" ("role");
    `);

    await queryRunner.query(`
      CREATE TABLE "stores" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" varchar(120) NOT NULL,
        "email" varchar(255) NOT NULL,
        "address" varchar(400) NOT NULL,
        "owner_id" uuid NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_stores_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_stores_email" UNIQUE ("email"),
        CONSTRAINT "FK_stores_owner" FOREIGN KEY ("owner_id") REFERENCES "users" ("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_STORES_OWNER_ID" ON "stores" ("owner_id");
      CREATE INDEX "IDX_STORES_NAME" ON "stores" ("name");
      CREATE INDEX "IDX_STORES_ADDRESS" ON "stores" ("address");
    `);

    await queryRunner.query(`
      CREATE TABLE "ratings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "value" smallint NOT NULL,
        "user_id" uuid NOT NULL,
        "store_id" uuid NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ratings_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_RATINGS_USER_STORE" UNIQUE ("user_id", "store_id"),
        CONSTRAINT "CHK_RATING_VALUE" CHECK ("value" BETWEEN 1 AND 5),
        CONSTRAINT "FK_ratings_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_ratings_store" FOREIGN KEY ("store_id") REFERENCES "stores" ("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_RATINGS_USER_ID" ON "ratings" ("user_id");
      CREATE INDEX "IDX_RATINGS_STORE_ID" ON "ratings" ("store_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "ratings";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "stores";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_role_enum";`);
  }
}
