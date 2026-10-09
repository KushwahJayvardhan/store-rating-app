import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Rating } from '../entities/rating.entity';
import { Store } from '../entities/store.entity';
import { User, UserRole } from '../entities/user.entity';
import { StoresService } from './stores.service';

jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => undefined,
}));

describe('StoresService', () => {
  let service: StoresService;
  let storesRepository: jest.Mocked<
    Pick<
      Repository<Store>,
      'findOneBy' | 'create' | 'save' | 'createQueryBuilder'
    >
  >;
  let usersRepository: jest.Mocked<Pick<Repository<User>, 'findOneBy'>>;
  let ratingsRepository: jest.Mocked<
    Pick<Repository<Rating>, 'createQueryBuilder'>
  >;

  beforeEach(() => {
    storesRepository = {
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    usersRepository = { findOneBy: jest.fn() };
    ratingsRepository = { createQueryBuilder: jest.fn() };
    service = new StoresService(
      storesRepository as unknown as Repository<Store>,
      usersRepository as unknown as Repository<User>,
      ratingsRepository as unknown as Repository<Rating>,
    );
  });

  it('creates a store for a store owner without accepting client rating data', async () => {
    const owner = {
      id: 'owner-id',
      name: 'Owner Person',
      email: 'owner@example.com',
      role: UserRole.STORE_OWNER,
    } as User;
    usersRepository.findOneBy.mockResolvedValue(owner);
    storesRepository.findOneBy.mockResolvedValue(null);
    storesRepository.create.mockImplementation((store) => store as Store);
    storesRepository.save.mockImplementation((store) =>
      Promise.resolve({
        ...store,
        id: 'store-id',
        createdAt: new Date(),
      } as Store),
    );

    const result = await service.create({
      name: ' Store Name ',
      email: ' STORE@EXAMPLE.COM ',
      address: ' Address ',
      ownerId: 'owner-id',
    });

    expect(storesRepository.create.mock.calls[0][0]).toEqual({
      name: 'Store Name',
      email: 'store@example.com',
      address: 'Address',
      ownerId: 'owner-id',
    });
    expect(result).toMatchObject({
      id: 'store-id',
      email: 'store@example.com',
      owner: { id: 'owner-id', email: 'owner@example.com' },
      averageRating: null,
    });
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('rejects an owner who does not have the STORE_OWNER role', async () => {
    usersRepository.findOneBy.mockResolvedValue({
      id: 'user-id',
      role: UserRole.NORMAL_USER,
    } as User);
    storesRepository.findOneBy.mockResolvedValue(null);

    await expect(
      service.create({
        name: 'Store Name',
        email: 'store@example.com',
        address: 'Address',
        ownerId: 'user-id',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(storesRepository.save.mock.calls).toHaveLength(0);
  });

  it('rejects a store owner who already owns a store', async () => {
    usersRepository.findOneBy.mockResolvedValue({
      id: 'owner-id',
      role: UserRole.STORE_OWNER,
    } as User);
    storesRepository.findOneBy
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'existing-store' } as Store);

    await expect(
      service.create({
        name: 'Store Name',
        email: 'store@example.com',
        address: 'Address',
        ownerId: 'owner-id',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(storesRepository.save.mock.calls).toHaveLength(0);
  });

  it('rejects a duplicate store email', async () => {
    storesRepository.findOneBy.mockResolvedValue({ id: 'existing' } as Store);
    usersRepository.findOneBy.mockResolvedValue({
      id: 'owner-id',
      role: UserRole.STORE_OWNER,
    } as User);

    await expect(
      service.create({
        name: 'Store Name',
        email: 'store@example.com',
        address: 'Address',
        ownerId: 'owner-id',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(storesRepository.save.mock.calls).toHaveLength(0);
  });

  it('filters, paginates, whitelists sorting, and calculates averages from ratings', async () => {
    const store = {
      id: 'store-id',
      name: 'Store Name',
      email: 'store@example.com',
      address: 'Some Address',
      owner: {
        id: 'owner-id',
        name: 'Owner Person',
        email: 'owner@example.com',
      },
      createdAt: new Date(),
    } as Store;
    const storeQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[store], 1]),
    };
    const ratingQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest
        .fn()
        .mockResolvedValue([{ storeId: 'store-id', averageRating: '4.25' }]),
    };
    storesRepository.createQueryBuilder.mockReturnValue(
      storeQueryBuilder as unknown as SelectQueryBuilder<Store>,
    );
    ratingsRepository.createQueryBuilder.mockReturnValue(
      ratingQueryBuilder as unknown as SelectQueryBuilder<Rating>,
    );

    const result = await service.findAll({
      name: 'Store%',
      email: 'STORE@example.com',
      address: 'Address',
      page: 2,
      limit: 5,
      sortBy: 'rating',
      sortOrder: 'ASC',
    });

    expect(storeQueryBuilder.andWhere.mock.calls).toEqual([
      ['store.name ILIKE :name', { name: '%Store\\%%' }],
      ['store.email ILIKE :email', { email: '%STORE@example.com%' }],
      ['store.address ILIKE :address', { address: '%Address%' }],
    ]);
    expect(storeQueryBuilder.orderBy.mock.calls[0]).toEqual([
      '(SELECT AVG(rating.value) FROM ratings rating WHERE rating.store_id = store.id)',
      'ASC',
    ]);
    expect(storeQueryBuilder.skip.mock.calls).toEqual([[5]]);
    expect(storeQueryBuilder.take.mock.calls).toEqual([[5]]);
    expect(result).toMatchObject({
      data: [
        {
          id: 'store-id',
          averageRating: 4.25,
          owner: { id: 'owner-id' },
        },
      ],
      meta: { page: 2, limit: 5, total: 1, totalPages: 1 },
    });
    expect(result.data[0]).not.toHaveProperty('passwordHash');
  });

  it('returns not found for a missing store', async () => {
    storesRepository.createQueryBuilder.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    } as unknown as SelectQueryBuilder<Store>);

    await expect(service.findOne('missing-id')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns a single store with its calculated average rating', async () => {
    const store = {
      id: 'store-id',
      name: 'Store Name',
      email: 'store@example.com',
      address: 'Address',
      owner: {
        id: 'owner-id',
        name: 'Owner Person',
        email: 'owner@example.com',
      },
      createdAt: new Date(),
    } as Store;
    storesRepository.createQueryBuilder.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(store),
    } as unknown as SelectQueryBuilder<Store>);
    const ratingQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest
        .fn()
        .mockResolvedValue([{ storeId: 'store-id', averageRating: '3.75' }]),
    };
    ratingsRepository.createQueryBuilder.mockReturnValue(
      ratingQueryBuilder as unknown as SelectQueryBuilder<Rating>,
    );

    await expect(service.findOne('store-id')).resolves.toMatchObject({
      id: 'store-id',
      averageRating: 3.75,
      owner: { id: 'owner-id' },
    });
  });
});
