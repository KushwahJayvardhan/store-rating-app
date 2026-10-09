import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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

@Injectable()
export class RatingsService {
  constructor(
    @InjectRepository(Rating)
    private readonly ratingsRepository: Repository<Rating>,
    @InjectRepository(Store)
    private readonly storesRepository: Repository<Store>,
  ) {}

  async create(userId: string, dto: CreateRatingDto): Promise<RatingResponse> {
    const store = await this.storesRepository.findOneBy({ id: dto.storeId });
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const existingRating = await this.ratingsRepository.findOneBy({
      userId,
      storeId: dto.storeId,
    });
    if (existingRating) {
      throw new ConflictException('You have already rated this store');
    }

    const rating = this.ratingsRepository.create({
      userId,
      storeId: dto.storeId,
      value: dto.value,
    });
    try {
      return this.toResponse(await this.ratingsRepository.save(rating));
    } catch (error: unknown) {
      if (this.isUniqueConstraintViolation(error)) {
        throw new ConflictException('You have already rated this store');
      }
      throw error;
    }
  }

  async update(
    userId: string,
    ratingId: string,
    dto: UpdateRatingDto,
  ): Promise<RatingResponse> {
    const rating = await this.ratingsRepository.findOneBy({
      id: ratingId,
      userId,
    });
    if (!rating) {
      throw new NotFoundException('Rating not found');
    }

    rating.value = dto.value;
    return this.toResponse(await this.ratingsRepository.save(rating));
  }

  async listStores(
    userId: string,
    query: ListRatedStoresDto,
  ): Promise<PaginatedRatedStores> {
    const queryBuilder = this.storesRepository
      .createQueryBuilder('store')
      .select(['store.id', 'store.name', 'store.address']);

    if (query.name) {
      queryBuilder.andWhere('store.name ILIKE :name', {
        name: `%${this.escapeLike(query.name)}%`,
      });
    }
    if (query.address) {
      queryBuilder.andWhere('store.address ILIKE :address', {
        address: `%${this.escapeLike(query.address)}%`,
      });
    }

    const [stores, total] = await queryBuilder
      .orderBy('store.name', 'ASC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    const ratings = await this.findRatingAggregates(
      stores.map((store) => store.id),
      userId,
    );
    const aggregatesByStore = new Map(
      ratings.map((rating) => [
        rating.storeId,
        {
          averageRating: rating.averageRating
            ? Number(rating.averageRating)
            : null,
          userRating:
            rating.userRating === null ? null : Number(rating.userRating),
        },
      ]),
    );

    return {
      data: stores.map((store) => {
        const aggregate = aggregatesByStore.get(store.id);
        return {
          id: store.id,
          name: store.name,
          address: store.address,
          averageRating: aggregate?.averageRating ?? null,
          userRating: aggregate?.userRating ?? null,
          hasRated: aggregate?.userRating !== null && aggregate !== undefined,
        };
      }),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  private findRatingAggregates(
    storeIds: string[],
    userId: string,
  ): Promise<
    Array<{
      storeId: string;
      averageRating: string | null;
      userRating: string | null;
    }>
  > {
    if (storeIds.length === 0) {
      return Promise.resolve([]);
    }

    return this.ratingsRepository
      .createQueryBuilder('rating')
      .select('rating.storeId', 'storeId')
      .addSelect('AVG(rating.value)', 'averageRating')
      .addSelect(
        'MAX(CASE WHEN rating.userId = :userId THEN rating.value END)',
        'userRating',
      )
      .where('rating.storeId IN (:...storeIds)', { storeIds })
      .setParameter('userId', userId)
      .groupBy('rating.storeId')
      .getRawMany();
  }

  private escapeLike(value: string): string {
    return value.replace(/[\\%_]/g, '\\$&');
  }

  private toResponse(rating: Rating): RatingResponse {
    return {
      id: rating.id,
      storeId: rating.storeId,
      value: rating.value,
      createdAt: rating.createdAt,
      updatedAt: rating.updatedAt,
    };
  }

  private isUniqueConstraintViolation(error: unknown): boolean {
    if (
      typeof error !== 'object' ||
      error === null ||
      !('driverError' in error) ||
      typeof error.driverError !== 'object' ||
      error.driverError === null ||
      !('code' in error.driverError)
    ) {
      return false;
    }

    return (
      error.driverError.code === '23505' ||
      error.driverError.code === '1062' ||
      error.driverError.code === 'ER_DUP_ENTRY'
    );
  }
}
