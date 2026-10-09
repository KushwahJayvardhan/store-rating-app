import { Rating } from './rating.entity';
import { User } from './user.entity';
export declare class Store {
    id: string;
    name: string;
    email: string;
    address: string;
    ownerId: string;
    createdAt: Date;
    updatedAt: Date;
    owner: User;
    ratings: Rating[];
}
