import { Repository } from 'typeorm';
import { Rating } from '../entities/rating.entity';
import { Store } from '../entities/store.entity';
import { User } from '../entities/user.entity';
import { CreateStoreDto } from './dto/create-store.dto';
import { ListStoresDto } from './dto/list-stores.dto';
export interface StoreOwnerSummary {
    id: string;
    name: string;
    email: string;
}
export interface StoreResponse {
    id: string;
    name: string;
    email: string;
    address: string;
    owner: StoreOwnerSummary;
    averageRating: number | null;
    createdAt: Date;
}
export interface PaginatedStores {
    data: StoreResponse[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export declare class StoresService {
    private readonly storesRepository;
    private readonly usersRepository;
    private readonly ratingsRepository;
    constructor(storesRepository: Repository<Store>, usersRepository: Repository<User>, ratingsRepository: Repository<Rating>);
    create(dto: CreateStoreDto): Promise<StoreResponse>;
    findAll(query: ListStoresDto): Promise<PaginatedStores>;
    findOne(id: string): Promise<StoreResponse>;
    private createStoreQuery;
    private applyFilters;
    private getAverageRatings;
    private escapeLike;
    private toResponse;
    private isUniqueConstraintViolation;
}
