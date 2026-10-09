import type { Request } from 'express';
import type { AuthenticatedUser } from '../auth/auth.types';
import { ListRatedStoresDto } from './dto/list-rated-stores.dto';
import { CreateRatingDto, UpdateRatingDto } from './dto/rating.dto';
import { RatingsService } from './ratings.service';
type AuthenticatedRequest = Request & {
    user: AuthenticatedUser;
};
export declare class RatingsController {
    private readonly ratingsService;
    constructor(ratingsService: RatingsService);
    listStores(request: AuthenticatedRequest, query: ListRatedStoresDto): Promise<import("./ratings.service").PaginatedRatedStores>;
    create(request: AuthenticatedRequest, dto: CreateRatingDto): Promise<{
        data: import("./ratings.service").RatingResponse;
    }>;
    update(request: AuthenticatedRequest, ratingId: string, dto: UpdateRatingDto): Promise<{
        data: import("./ratings.service").RatingResponse;
    }>;
}
export {};
