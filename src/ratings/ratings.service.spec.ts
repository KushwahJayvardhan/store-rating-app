import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Rating } from '../entities/rating.entity';
import { Store } from '../entities/store.entity';
import { RatingsService } from './ratings.service';

jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => undefined,
}));

describe('RatingsService', () => {
  let service: RatingsService;
  let ratingsRepository: jest.Mocked<
    Pick<
      Repository<Rating>,
      'findOneBy' | 'create' | 'save' | 'createQueryBuilder'
    >
  >;
  let storesRepository: jest.Mocked<
    Pick<Repository<Store>, 'findOneBy' | 'createQueryBuilder'>
  >;

  beforeEach(() => {
    ratingsRepository = {
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    storesRepository = {
      findOneBy: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    service = new RatingsService(
      ratingsRepository as unknown as Repository<Rating>,
      storesRepository as unknown as Repository<Store>,
    );
  });

  it.each([1, 5])('creates rating value %s', async (value) => {
    storesRepository.findOneBy.mockResolvedValue({ id: 'store-id' } as Store);
    ratingsRepository.findOneBy.mockResolvedValue(null);
    ratingsRepository.create.mockImplementation((rating) => rating as Rating);
    ratingsRepository.save.mockImplementation((rating) =>
      Promise.resolve({
        ...rating,
        id: 'rating-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Rating),
    );

    const response = await service.create('user-id', {
      storeId: 'store-id',
      value,
    });

    expect(ratingsRepository.create.mock.calls[0][0]).toEqual({
      userId: 'user-id',
      storeId: 'store-id',
      value,
    });
    expect(response).toMatchObject({
      id: 'rating-id',
      storeId: 'store-id',
      value,
    });
  });

  it('returns not found when creating a rating for a nonexistent store', async () => {
    storesRepository.findOneBy.mockResolvedValue(null);

    await expect(
      service.create('user-id', {
        storeId: 'store-id',
        value: 3,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(ratingsRepository.save.mock.calls).toHaveLength(0);
  });

  it('returns conflict for a duplicate user-store rating', async () => {
    storesRepository.findOneBy.mockResolvedValue({ id: 'store-id' } as Store);
    ratingsRepository.findOneBy.mockResolvedValue({
      id: 'rating-id',
    } as Rating);

    await expect(
      service.create('user-id', {
        storeId: 'store-id',
        value: 4,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(ratingsRepository.save.mock.calls).toHaveLength(0);
  });

  it('updates the existing rating belonging to the authenticated user', async () => {
    const rating = {
      id: 'rating-id',
      userId: 'user-id',
      storeId: 'store-id',
      value: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Rating;
    ratingsRepository.findOneBy.mockResolvedValue(rating);
    ratingsRepository.save.mockImplementation((value) =>
      Promise.resolve(value),
    );

    const result = await service.update('user-id', 'rating-id', {
      value: 5,
    });

    expect(ratingsRepository.findOneBy.mock.calls[0][0]).toEqual({
      id: 'rating-id',
      userId: 'user-id',
    });
    expect(ratingsRepository.save.mock.calls[0][0]).toBe(rating);
    expect(rating.value).toBe(5);
    expect(result.value).toBe(5);
  });

  it('does not allow a user to update another user rating', async () => {
    ratingsRepository.findOneBy.mockResolvedValue(null);

    await expect(
      service.update('requesting-user', 'other-rating', {
        value: 4,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(ratingsRepository.save.mock.calls).toHaveLength(0);
  });

  it('returns store listings with only the current user rating and overall averages', async () => {
    const stores = [
      {
        id: 'store-1',
        name: 'Store One',
        address: 'Address One',
      },
      {
        id: 'store-2',
        name: 'Store Two',
        address: 'Address Two',
      },
    ] as Store[];
    const storeQuery = {
      select: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([stores, 2]),
    };
    const ratingQuery = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      setParameter: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([
        {
          storeId: 'store-1',
          averageRating: '4',
          userRating: '3',
        },
        {
          storeId: 'store-2',
          averageRating: '5',
          userRating: null,
        },
      ]),
    };
    storesRepository.createQueryBuilder.mockReturnValue(
      storeQuery as unknown as SelectQueryBuilder<Store>,
    );
    ratingsRepository.createQueryBuilder.mockReturnValue(
      ratingQuery as unknown as SelectQueryBuilder<Rating>,
    );

    const response = await service.listStores('user-id', {
      name: 'Store',
      address: 'Address',
      page: 1,
      limit: 20,
    });

    expect(storeQuery.andWhere.mock.calls).toEqual([
      ['store.name ILIKE :name', { name: '%Store%' }],
      ['store.address ILIKE :address', { address: '%Address%' }],
    ]);
    expect(storeQuery.addOrderBy.mock.calls[0]).toEqual(['store.id', 'ASC']);
    expect(ratingQuery.setParameter.mock.calls[0]).toEqual([
      'userId',
      'user-id',
    ]);
    expect(response.data).toEqual([
      {
        id: 'store-1',
        name: 'Store One',
        address: 'Address One',
        averageRating: 4,
        userRating: 3,
        hasRated: true,
      },
      {
        id: 'store-2',
        name: 'Store Two',
        address: 'Address Two',
        averageRating: 5,
        userRating: null,
        hasRated: false,
      },
    ]);
    expect(response.data[0]).not.toHaveProperty('ratings');
    expect(response.meta).toEqual({
      page: 1,
      limit: 20,
      total: 2,
      totalPages: 1,
    });
  });
});
