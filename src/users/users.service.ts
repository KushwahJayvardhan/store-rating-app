import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Rating } from '../entities/rating.entity';
import { User, UserRole } from '../entities/user.entity';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { ListUsersDto, UserSortField } from './dto/list-users.dto';

const BCRYPT_ROUNDS = 12;
const USER_SORT_COLUMNS: Record<UserSortField, string> = {
  name: 'user.name',
  email: 'user.email',
  address: 'user.address',
  role: 'user.role',
  createdAt: 'user.createdAt',
};

export interface UserListItem {
  id: string;
  name: string;
  email: string;
  address: string;
  role: UserRole;
}

export interface UserStoreDetails {
  id: string;
  name: string;
  email: string;
  address: string;
  averageRating: number | null;
}

export interface UserDetails extends UserListItem {
  createdAt: Date;
  updatedAt: Date;
  stores?: UserStoreDetails[];
}

export interface PaginatedUsers {
  data: UserListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Rating)
    private readonly ratingsRepository: Repository<Rating>,
  ) {}

  async create(dto: CreateAdminUserDto): Promise<UserListItem> {
    const email = dto.email.trim().toLowerCase();
    const existingUser = await this.usersRepository.findOneBy({ email });
    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const user = this.usersRepository.create({
      name: dto.name.trim(),
      email,
      address: dto.address.trim(),
      passwordHash: await bcrypt.hash(dto.password, BCRYPT_ROUNDS),
      role: dto.role,
    });

    try {
      return this.toListItem(await this.usersRepository.save(user));
    } catch (error: unknown) {
      if (this.isUniqueConstraintViolation(error)) {
        throw new ConflictException('Email is already registered');
      }
      throw error;
    }
  }

  async findAll(query: ListUsersDto): Promise<PaginatedUsers> {
    const queryBuilder = this.usersRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.name',
        'user.email',
        'user.address',
        'user.role',
      ]);

    this.applyFilters(queryBuilder, query);

    const [users, total] = await queryBuilder
      .orderBy(USER_SORT_COLUMNS[query.sortBy], query.sortOrder)
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    return {
      data: users.map((user) => this.toListItem(user)),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async findOne(id: string): Promise<UserDetails> {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.name',
        'user.email',
        'user.address',
        'user.role',
        'user.createdAt',
        'user.updatedAt',
      ])
      .leftJoinAndSelect('user.store', 'store')
      .addSelect(['store.id', 'store.name', 'store.email', 'store.address'])
      .where('user.id = :id', { id })
      .getOne();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const details: UserDetails = {
      ...this.toListItem(user),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    if (user.role === UserRole.STORE_OWNER) {
      const storeIds = user.store ? [user.store.id] : [];
      const ratings = storeIds.length
        ? await this.ratingsRepository
            .createQueryBuilder('rating')
            .select('rating.storeId', 'storeId')
            .addSelect('AVG(rating.value)', 'averageRating')
            .where('rating.storeId IN (:...storeIds)', { storeIds })
            .groupBy('rating.storeId')
            .getRawMany<{ storeId: string; averageRating: string }>()
        : [];
      const ratingsByStore = new Map(
        ratings.map(({ storeId, averageRating }) => [
          storeId,
          Number(averageRating),
        ]),
      );

      if (user.store) {
        details.stores = [
          {
            id: user.store.id,
            name: user.store.name,
            email: user.store.email,
            address: user.store.address,
            averageRating: ratingsByStore.get(user.store.id) ?? null,
          },
        ];
      } else {
        details.stores = [];
      }
    }

    return details;
  }

  private applyFilters(
    queryBuilder: SelectQueryBuilder<User>,
    query: ListUsersDto,
  ): void {
    if (query.name) {
      queryBuilder.andWhere('user.name ILIKE :name', {
        name: `%${this.escapeLike(query.name)}%`,
      });
    }
    if (query.email) {
      queryBuilder.andWhere('user.email ILIKE :email', {
        email: `%${this.escapeLike(query.email)}%`,
      });
    }
    if (query.address) {
      queryBuilder.andWhere('user.address ILIKE :address', {
        address: `%${this.escapeLike(query.address)}%`,
      });
    }
    if (query.role) {
      queryBuilder.andWhere('user.role = :role', { role: query.role });
    }
  }

  private escapeLike(value: string): string {
    return value.replace(/[\\%_]/g, '\\$&');
  }

  private toListItem(user: User): UserListItem {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      address: user.address,
      role: user.role,
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
