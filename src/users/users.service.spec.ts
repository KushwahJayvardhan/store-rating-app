import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Rating } from '../entities/rating.entity';
import { User, UserRole } from '../entities/user.entity';
import { UsersService } from './users.service';

jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => undefined,
}));

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: jest.Mocked<
    Pick<
      Repository<User>,
      'findOneBy' | 'create' | 'save' | 'createQueryBuilder'
    >
  >;
  let ratingsRepository: jest.Mocked<
    Pick<Repository<Rating>, 'createQueryBuilder'>
  >;

  beforeEach(() => {
    usersRepository = {
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    ratingsRepository = { createQueryBuilder: jest.fn() };
    service = new UsersService(
      usersRepository as unknown as Repository<User>,
      ratingsRepository as unknown as Repository<Rating>,
    );
  });

  it.each([UserRole.NORMAL_USER, UserRole.SYSTEM_ADMIN, UserRole.STORE_OWNER])(
    'creates an admin-managed %s with a bcrypt password hash',
    async (role) => {
      usersRepository.findOneBy.mockResolvedValue(null);
      usersRepository.create.mockImplementation((user) => user as User);
      usersRepository.save.mockImplementation((user) =>
        Promise.resolve({
          ...user,
          id: 'user-id',
          createdAt: new Date(),
          updatedAt: new Date(),
        } as User),
      );

      const result = await service.create({
        name: 'A Valid Person With A Long Name',
        email: ' Person@Example.com ',
        address: '  Address  ',
        password: 'Password1!',
        role,
      });
      const savedUser = usersRepository.save.mock.calls[0][0];

      expect(savedUser.email).toBe('person@example.com');
      expect(savedUser.address).toBe('Address');
      expect(savedUser.role).toBe(role);
      expect(await bcrypt.compare('Password1!', savedUser.passwordHash)).toBe(
        true,
      );
      expect(result).not.toHaveProperty('passwordHash');
      expect(result).toEqual(
        expect.objectContaining({
          id: 'user-id',
          role,
        }),
      );
    },
  );

  it('rejects duplicate emails without creating a user', async () => {
    usersRepository.findOneBy.mockResolvedValue({ id: 'existing' } as User);

    await expect(
      service.create({
        name: 'A Valid Person With A Long Name',
        email: 'person@example.com',
        address: 'Address',
        password: 'Password1!',
        role: UserRole.NORMAL_USER,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(usersRepository.save.mock.calls).toHaveLength(0);
  });

  it('filters, safely sorts, and paginates the user listing', async () => {
    const queryBuilder = {
      select: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([
        [
          {
            id: 'user-id',
            name: 'A Valid Person With A Long Name',
            email: 'person@example.com',
            address: 'Some Address',
            role: UserRole.NORMAL_USER,
          },
        ],
        21,
      ]),
    };
    usersRepository.createQueryBuilder.mockReturnValue(
      queryBuilder as unknown as SelectQueryBuilder<User>,
    );

    const response = await service.findAll({
      name: 'Person%',
      email: 'PERSON@EXAMPLE.COM',
      address: 'Somewhere',
      role: UserRole.NORMAL_USER,
      page: 2,
      limit: 10,
      sortBy: 'email',
      sortOrder: 'ASC',
    });

    expect(queryBuilder.andWhere.mock.calls).toEqual([
      ['user.name ILIKE :name', { name: '%Person\\%%' }],
      ['user.email ILIKE :email', { email: '%PERSON@EXAMPLE.COM%' }],
      ['user.address ILIKE :address', { address: '%Somewhere%' }],
      ['user.role = :role', { role: UserRole.NORMAL_USER }],
    ]);
    expect(queryBuilder.orderBy.mock.calls[0]).toEqual(['user.email', 'ASC']);
    expect(queryBuilder.addOrderBy.mock.calls[0]).toEqual(['user.id', 'ASC']);
    expect(queryBuilder.skip.mock.calls).toEqual([[10]]);
    expect(queryBuilder.take.mock.calls).toEqual([[10]]);
    expect(response).toMatchObject({
      data: [{ id: 'user-id', role: UserRole.NORMAL_USER }],
      meta: { page: 2, limit: 10, total: 21, totalPages: 3 },
    });
    expect(response.data[0]).not.toHaveProperty('passwordHash');
  });

  it('includes associated store average ratings in store owner details', async () => {
    const owner = {
      id: 'owner-id',
      name: 'A Valid Person With A Long Name',
      email: 'owner@example.com',
      address: 'Address',
      role: UserRole.STORE_OWNER,
      createdAt: new Date(),
      updatedAt: new Date(),
      store: {
        id: 'store-id',
        name: 'Store',
        email: 'store@example.com',
        address: 'Store Address',
      },
    } as User;
    const userQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(owner),
    };
    const ratingQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest
        .fn()
        .mockResolvedValue([{ storeId: 'store-id', averageRating: '4.5' }]),
    };
    usersRepository.createQueryBuilder.mockReturnValue(
      userQueryBuilder as unknown as SelectQueryBuilder<User>,
    );
    ratingsRepository.createQueryBuilder.mockReturnValue(
      ratingQueryBuilder as unknown as SelectQueryBuilder<Rating>,
    );

    const details = await service.findOne('owner-id');

    expect(details.stores).toEqual([
      {
        id: 'store-id',
        name: 'Store',
        email: 'store@example.com',
        address: 'Store Address',
        averageRating: 4.5,
      },
    ]);
    expect(details).not.toHaveProperty('passwordHash');
    expect(ratingQueryBuilder.where.mock.calls[0]).toEqual([
      'rating.storeId IN (:...storeIds)',
      { storeIds: ['store-id'] },
    ]);
  });

  it('returns not found for a missing user detail request', async () => {
    usersRepository.createQueryBuilder.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    } as unknown as SelectQueryBuilder<User>);

    await expect(service.findOne('missing-id')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
