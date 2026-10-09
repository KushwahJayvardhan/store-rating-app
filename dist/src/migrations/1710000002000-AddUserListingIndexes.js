"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddUserListingIndexes1710000002000 = void 0;
class AddUserListingIndexes1710000002000 {
    name = 'AddUserListingIndexes1710000002000';
    async up(queryRunner) {
        await queryRunner.query(`CREATE INDEX "IDX_USERS_NAME" ON "users" ("name");`);
        await queryRunner.query(`CREATE INDEX "IDX_USERS_ADDRESS" ON "users" ("address");`);
        await queryRunner.query(`CREATE INDEX "IDX_USERS_CREATED_AT" ON "users" ("created_at");`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "IDX_USERS_CREATED_AT";`);
        await queryRunner.query(`DROP INDEX "IDX_USERS_ADDRESS";`);
        await queryRunner.query(`DROP INDEX "IDX_USERS_NAME";`);
    }
}
exports.AddUserListingIndexes1710000002000 = AddUserListingIndexes1710000002000;
//# sourceMappingURL=1710000002000-AddUserListingIndexes.js.map