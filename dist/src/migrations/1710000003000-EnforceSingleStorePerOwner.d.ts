import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class EnforceSingleStorePerOwner1710000003000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
