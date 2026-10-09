"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnforceSingleStorePerOwner1710000003000 = void 0;
class EnforceSingleStorePerOwner1710000003000 {
    name = 'EnforceSingleStorePerOwner1710000003000';
    async up(queryRunner) {
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_STORES_OWNER_ID" ON "stores" ("owner_id");`);
        await queryRunner.query(`DROP INDEX "IDX_STORES_OWNER_ID";`);
        await queryRunner.query(`CREATE INDEX "IDX_STORES_CREATED_AT" ON "stores" ("created_at");`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "IDX_STORES_CREATED_AT";`);
        await queryRunner.query(`DROP INDEX "UQ_STORES_OWNER_ID";`);
        await queryRunner.query(`CREATE INDEX "IDX_STORES_OWNER_ID" ON "stores" ("owner_id");`);
    }
}
exports.EnforceSingleStorePerOwner1710000003000 = EnforceSingleStorePerOwner1710000003000;
//# sourceMappingURL=1710000003000-EnforceSingleStorePerOwner.js.map