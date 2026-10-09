import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Rating } from '../entities/rating.entity';
import { Store } from '../entities/store.entity';
import {
  ListStoreRatingsDto,
  StoreRatingSortField,
} from './dto/list-store-ratings.dto';

const RATING_SORT_COLUMNS: Record<StoreRatingSortField, string> = {
  name: 'user.name',
  email: 'user.email',
  rating: 'rating.value',
  createdAt: 'rating.createdAt',
};

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

@Injectable()
export class StoreOwnerDashboardService {
  constructor(
    @InjectRepository(Store)
    private readonly storesRepository: Repository<Store>,
    @InjectRepository(Rating)
    private readonly ratingsRepository: Repository<Rating>,
  ) {}

  async getDashboard(
    ownerId: string,
    query: ListStoreRatingsDto,
  ): Promise<StoreOwnerDashboard> {
    const store = await this.storesRepository.findOneBy({ ownerId });
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const [aggregate, [ratings, total]] = await Promise.all([
      this.ratingsRepository
        .createQueryBuilder('rating')
        .select('AVG(rating.value)', 'averageRating')
        .where('rating.storeId = :storeId', { storeId: store.id })
        .getRawOne<{ averageRating: string | null }>(),
      this.createRatersQuery(store.id)
        .orderBy(RATING_SORT_COLUMNS[query.sortBy], query.sortOrder)
        .addOrderBy('rating.id', 'ASC')
        .skip((query.page - 1) * query.limit)
        .take(query.limit)
        .getManyAndCount(),
    ]);

    return {
      averageRating:
        aggregate?.averageRating === null ||
        aggregate?.averageRating === undefined
          ? null
          : Number(aggregate.averageRating),
      ratings: ratings.map((rating) => ({
        name: rating.user.name,
        email: rating.user.email,
        address: rating.user.address,
        rating: rating.value,
        submittedAt: rating.createdAt,
      })),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  private createRatersQuery(storeId: string): SelectQueryBuilder<Rating> {
    return this.ratingsRepository
      .createQueryBuilder('rating')
      .select([
        'rating.id',
        'rating.value',
        'rating.createdAt',
        'user.id',
        'user.name',
        'user.email',
        'user.address',
      ])
      .innerJoin('rating.user', 'user')
      .where('rating.storeId = :storeId', { storeId });
  }
}
