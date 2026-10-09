"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateUserRolesToNamedRoles1710000001000 = void 0;
class UpdateUserRolesToNamedRoles1710000001000 {
    name = 'UpdateUserRolesToNamedRoles1710000001000';
    async up(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
      ALTER TYPE "user_role_enum" RENAME TO "user_role_enum_old";
      CREATE TYPE "user_role_enum" AS ENUM (
        'SYSTEM_ADMIN',
        'NORMAL_USER',
        'STORE_OWNER'
      );
      ALTER TABLE "users"
        ALTER COLUMN "role" TYPE "user_role_enum"
        USING (
          CASE "role"::text
            WHEN 'ADMIN' THEN 'SYSTEM_ADMIN'
            WHEN 'USER' THEN 'NORMAL_USER'
            ELSE "role"::text
          END
        )::"user_role_enum";
      ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'NORMAL_USER';
      DROP TYPE "user_role_enum_old";
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
      ALTER TYPE "user_role_enum" RENAME TO "user_role_enum_new";
      CREATE TYPE "user_role_enum" AS ENUM ('ADMIN', 'USER', 'STORE_OWNER');
      ALTER TABLE "users"
        ALTER COLUMN "role" TYPE "user_role_enum"
        USING (
          CASE "role"::text
            WHEN 'SYSTEM_ADMIN' THEN 'ADMIN'
            WHEN 'NORMAL_USER' THEN 'USER'
            ELSE "role"::text
          END
        )::"user_role_enum";
      ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'USER';
      DROP TYPE "user_role_enum_new";
    `);
    }
}
exports.UpdateUserRolesToNamedRoles1710000001000 = UpdateUserRolesToNamedRoles1710000001000;
//# sourceMappingURL=1710000001000-UpdateUserRolesToNamedRoles.js.map