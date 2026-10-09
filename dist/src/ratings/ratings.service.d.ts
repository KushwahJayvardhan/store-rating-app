import { Repository } from 'typeorm';
import { Rating } from '../entities/rating.entity';
import { Store } from '../entities/store.entity';
import { CreateRatingDto, UpdateRatingDto } from './dto/rating.dto';
import { ListRatedStoresDto } from './dto/list-rated-stores.dto';
export interface RatingResponse {
    id: string;
    storeId: string;
    value: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface RatedStoreItem {
    id: string;
    name: string;
    address: string;
    averageRating: number | null;
    userRating: number | null;
    hasRated: boolean;
}
export interface PaginatedRatedStores {
    data: RatedStoreItem[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export declare class RatingsService {
    private readonly ratingsRepository;
    private readonly storesRepository;
    constructor(ratingsRepository: Repository<Rating>, storesRepository: Repository<Store>);
    create(userId: string, dto: CreateRatingDto): Promise<RatingResponse>;
    update(userId: string, ratingId: string, dto: UpdateRatingDto): Promise<RatingResponse>;
    listStores(userId: string, query: ListRatedStoresDto): Promise<PaginatedRatedStores>;
    private findRatingAggregates;
    private escapeLike;
    private toResponse;
    private isUniqueConstraintViolation;
}
