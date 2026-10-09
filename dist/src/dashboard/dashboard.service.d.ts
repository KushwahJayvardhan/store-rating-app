import { Repository } from 'typeorm';
import { Rating } from '../entities/rating.entity';
import { Store } from '../entities/store.entity';
import { User } from '../entities/user.entity';
export interface DashboardStatistics {
    totalUsers: number;
    totalStores: number;
    totalRatings: number;
}
export declare class DashboardService {
    private readonly usersRepository;
    private readonly storesRepository;
    private readonly ratingsRepository;
    constructor(usersRepository: Repository<User>, storesRepository: Repository<Store>, ratingsRepository: Repository<Rating>);
    getStatistics(): Promise<DashboardStatistics>;
}
