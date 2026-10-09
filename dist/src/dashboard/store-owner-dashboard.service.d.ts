import { Repository } from 'typeorm';
import { Rating } from '../entities/rating.entity';
import { Store } from '../entities/store.entity';
import { ListStoreRatingsDto } from './dto/list-store-ratings.dto';
export interface StoreRater {
    name: string;
    email: string;
    address: string;
    rating: number;
    submittedAt: Date;
}
export interface StoreOwnerDashboard {
    averageRating: number | null;
    ratings: StoreRater[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export declare class StoreOwnerDashboardService {
    private readonly storesRepository;
    private readonly ratingsRepository;
    constructor(storesRepository: Repository<Store>, ratingsRepository: Repository<Rating>);
    getDashboard(ownerId: string, query: ListStoreRatingsDto): Promise<StoreOwnerDashboard>;
    private createRatersQuery;
}
