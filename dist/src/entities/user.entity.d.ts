import { Rating } from './rating.entity';
import { Store } from './store.entity';
export declare enum UserRole {
    SYSTEM_ADMIN = "SYSTEM_ADMIN",
    NORMAL_USER = "NORMAL_USER",
    STORE_OWNER = "STORE_OWNER"
}
export declare class User {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    address: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
    store: Store | null;
    ratings: Rating[];
}
