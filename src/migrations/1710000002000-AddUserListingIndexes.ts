import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserListingIndexes1710000002000 implements MigrationInterface {
  name = 'AddUserListingIndexes1710000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_USERS_NAME" ON "users" ("name");`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_USERS_ADDRESS" ON "users" ("address");`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_USERS_CREATED_AT" ON "users" ("created_at");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_USERS_CREATED_AT";`);
    await queryRunner.query(`DROP INDEX "IDX_USERS_ADDRESS";`);
    await queryRunner.query(`DROP INDEX "IDX_USERS_NAME";`);
  }
}
