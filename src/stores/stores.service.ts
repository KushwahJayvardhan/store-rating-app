import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Rating } from '../entities/rating.entity';
import { Store } from '../entities/store.entity';
import { User, UserRole } from '../entities/user.entity';
import { CreateStoreDto } from './dto/create-store.dto';
import { ListStoresDto, StoreSortField } from './dto/list-stores.dto';

const STORE_SORT_COLUMNS: Record<StoreSortField, string> = {
  name: 'store.name',
  email: 'store.email',
  address: 'store.address',
  rating:
    '(SELECT AVG(rating.value) FROM ratings rating WHERE rating.store_id = store.id)',
  createdAt: 'store.createdAt',
};

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

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Store)
    private readonly storesRepository: Repository<Store>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Rating)
    private readonly ratingsRepository: Repository<Rating>,
  ) {}

  async create(dto: CreateStoreDto): Promise<StoreResponse> {
    const email = dto.email.trim().toLowerCase();
    const [existingEmail, owner] = await Promise.all([
      this.storesRepository.findOneBy({ email }),
      this.usersRepository.findOneBy({ id: dto.ownerId }),
    ]);

    if (existingEmail) {
      throw new ConflictException('Store email is already registered');
    }
    if (!owner || owner.role !== UserRole.STORE_OWNER) {
      throw new NotFoundException('Store owner not found');
    }

    const existingStore = await this.storesRepository.findOneBy({
      ownerId: owner.id,
    });
    if (existingStore) {
      throw new ConflictException('Store owner already has a store');
    }

    const store = this.storesRepository.create({
      name: dto.name.trim(),
      email,
      address: dto.address.trim(),
      ownerId: owner.id,
    });

    try {
      const createdStore = await this.storesRepository.save(store);
      return this.toResponse(createdStore, owner, null);
    } catch (error: unknown) {
      if (this.isUniqueConstraintViolation(error)) {
        throw new ConflictException(
          'Store email or owner is already registered',
        );
      }
      throw error;
    }
  }

  async findAll(query: ListStoresDto): Promise<PaginatedStores> {
    const queryBuilder = this.createStoreQuery();
    this.applyFilters(queryBuilder, query);

    const [stores, total] = await queryBuilder
      .orderBy(STORE_SORT_COLUMNS[query.sortBy], query.sortOrder)
      .addOrderBy('store.id', 'ASC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();
    const ratingsByStore = await this.getAverageRatings(
      stores.map((store) => store.id),
    );

    return {
      data: stores.map((store) =>
        this.toResponse(
          store,
          store.owner,
          ratingsByStore.get(store.id) ?? null,
        ),
      ),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async findOne(id: string): Promise<StoreResponse> {
    const store = await this.createStoreQuery()
      .where('store.id = :id', { id })
      .getOne();
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const ratingsByStore = await this.getAverageRatings([store.id]);
    return this.toResponse(
      store,
      store.owner,
      ratingsByStore.get(store.id) ?? null,
    );
  }

  private createStoreQuery(): SelectQueryBuilder<Store> {
    return this.storesRepository
      .createQueryBuilder('store')
      .select([
        'store.id',
        'store.name',
        'store.email',
        'store.address',
        'store.ownerId',
        'store.createdAt',
      ])
      .leftJoin('store.owner', 'owner')
      .addSelect(['owner.id', 'owner.name', 'owner.email']);
  }

  private applyFilters(
    queryBuilder: SelectQueryBuilder<Store>,
    query: ListStoresDto,
  ): void {
    if (query.name) {
      queryBuilder.andWhere('store.name ILIKE :name', {
        name: `%${this.escapeLike(query.name)}%`,
      });
    }
    if (query.email) {
      queryBuilder.andWhere('store.email ILIKE :email', {
        email: `%${this.escapeLike(query.email)}%`,
      });
    }
    if (query.address) {
      queryBuilder.andWhere('store.address ILIKE :address', {
        address: `%${this.escapeLike(query.address)}%`,
      });
    }
  }

  private async getAverageRatings(
    storeIds: string[],
  ): Promise<Map<string, number>> {
    if (storeIds.length === 0) {
      return new Map();
    }
    const averages = await this.ratingsRepository
      .createQueryBuilder('rating')
      .select('rating.storeId', 'storeId')
      .addSelect('AVG(rating.value)', 'averageRating')
      .where('rating.storeId IN (:...storeIds)', { storeIds })
      .groupBy('rating.storeId')
      .getRawMany<{ storeId: string; averageRating: string }>();

    return new Map(
      averages.map(({ storeId, averageRating }) => [
        storeId,
        Number(averageRating),
      ]),
    );
  }

  private escapeLike(value: string): string {
    return value.replace(/[\\%_]/g, '\\$&');
  }

  private toResponse(
    store: Store,
    owner: User,
    averageRating: number | null,
  ): StoreResponse {
    return {
      id: store.id,
      name: store.name,
      email: store.email,
      address: store.address,
      owner: {
        id: owner.id,
        name: owner.name,
        email: owner.email,
      },
      averageRating,
      createdAt: store.createdAt,
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
