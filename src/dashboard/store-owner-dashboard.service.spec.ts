import { NotFoundException } from '@nestjs/common';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Rating } from '../entities/rating.entity';
import { Store } from '../entities/store.entity';
import { StoreOwnerDashboardService } from './store-owner-dashboard.service';

jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => undefined,
}));

describe('StoreOwnerDashboardService', () => {
  let service: StoreOwnerDashboardService;
  let storesRepository: jest.Mocked<Pick<Repository<Store>, 'findOneBy'>>;
  let ratingsRepository: jest.Mocked<
    Pick<Repository<Rating>, 'createQueryBuilder'>
  >;

  beforeEach(() => {
    storesRepository = { findOneBy: jest.fn() };
    ratingsRepository = { createQueryBuilder: jest.fn() };
    service = new StoreOwnerDashboardService(
      storesRepository as unknown as Repository<Store>,
      ratingsRepository as unknown as Repository<Rating>,
    );
  });

  it('resolves the store from owner identity and queries aggregate plus paginated raters', async () => {
    storesRepository.findOneBy.mockResolvedValue({
      id: 'owner-store',
      ownerId: 'requesting-owner',
    } as Store);
    const averageQuery = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ averageRating: '4.5' }),
    };
    const ratersQuery = {
      select: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([
        [
          {
            value: 5,
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
            user: {
              name: 'A Rated User',
              email: 'rated@example.com',
              address: 'User Address',
            },
          },
        ],
        7,
      ]),
    };
    ratingsRepository.createQueryBuilder
      .mockReturnValueOnce(
        averageQuery as unknown as SelectQueryBuilder<Rating>,
      )
      .mockReturnValueOnce(
        ratersQuery as unknown as SelectQueryBuilder<Rating>,
      );

    const result = await service.getDashboard('requesting-owner', {
      page: 2,
      limit: 3,
      sortBy: 'name',
      sortOrder: 'ASC',
    });

    expect(storesRepository.findOneBy.mock.calls[0][0]).toEqual({
      ownerId: 'requesting-owner',
    });
    expect(averageQuery.where.mock.calls[0]).toEqual([
      'rating.storeId = :storeId',
      { storeId: 'owner-store' },
    ]);
    expect(ratersQuery.where.mock.calls[0]).toEqual([
      'rating.storeId = :storeId',
      { storeId: 'owner-store' },
    ]);
    expect(ratersQuery.orderBy.mock.calls[0]).toEqual(['user.name', 'ASC']);
    expect(ratersQuery.addOrderBy.mock.calls[0]).toEqual(['rating.id', 'ASC']);
    expect(ratersQuery.skip.mock.calls).toEqual([[3]]);
    expect(ratersQuery.take.mock.calls).toEqual([[3]]);
    expect(result).toEqual({
      averageRating: 4.5,
      ratings: [
        {
          name: 'A Rated User',
          email: 'rated@example.com',
          address: 'User Address',
          rating: 5,
          submittedAt: new Date('2026-01-01T00:00:00.000Z'),
        },
      ],
      meta: { page: 2, limit: 3, total: 7, totalPages: 3 },
    });
  });

  it('never returns ratings when authenticated owner has no store', async () => {
    storesRepository.findOneBy.mockResolvedValue(null);

    await expect(
      service.getDashboard('owner-without-store', {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(ratingsRepository.createQueryBuilder.mock.calls).toHaveLength(0);
  });
});
