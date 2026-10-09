import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnforceSingleStorePerOwner1710000003000 implements MigrationInterface {
  name = 'EnforceSingleStorePerOwner1710000003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_STORES_OWNER_ID" ON "stores" ("owner_id");`,
    );
    await queryRunner.query(`DROP INDEX "IDX_STORES_OWNER_ID";`);
    await queryRunner.query(
      `CREATE INDEX "IDX_STORES_CREATED_AT" ON "stores" ("created_at");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_STORES_CREATED_AT";`);
    await queryRunner.query(`DROP INDEX "UQ_STORES_OWNER_ID";`);
    await queryRunner.query(
      `CREATE INDEX "IDX_STORES_OWNER_ID" ON "stores" ("owner_id");`,
    );
  }
}
