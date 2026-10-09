import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rating } from '../entities/rating.entity';
import { Store } from '../entities/store.entity';
import { User } from '../entities/user.entity';

export interface DashboardStatistics {
  totalUsers: number;
  totalStores: number;
  totalRatings: number;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Store)
    private readonly storesRepository: Repository<Store>,
    @InjectRepository(Rating)
    private readonly ratingsRepository: Repository<Rating>,
  ) {}

  async getStatistics(): Promise<DashboardStatistics> {
    const [totalUsers, totalStores, totalRatings] = await Promise.all([
      this.usersRepository.count(),
      this.storesRepository.count(),
      this.ratingsRepository.count(),
    ]);

    return { totalUsers, totalStores, totalRatings };
  }
}
