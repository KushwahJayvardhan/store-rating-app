import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Store } from '../entities/store.entity';
export interface StoreOwnershipRepository {
    findOneBy(criteria: {
        id: string;
        ownerId: string;
    }): Promise<Store | null>;
}
export declare class StoreOwnershipGuard implements CanActivate {
    private readonly storesRepository;
    constructor(storesRepository: StoreOwnershipRepository);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
