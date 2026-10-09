import { Store } from './store.entity';
import { User } from './user.entity';
export declare class Rating {
    id: string;
    value: number;
    userId: string;
    storeId: string;
    createdAt: Date;
    updatedAt: Date;
    user: User;
    store: Store;
}
