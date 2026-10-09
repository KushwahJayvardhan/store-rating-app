import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateStoreDto } from './create-store.dto';
import { ListStoresDto } from './list-stores.dto';

describe('store management DTO validation', () => {
  it('normalizes valid store input and rejects invalid email, address, and owner ID', async () => {
    const dto = plainToInstance(CreateStoreDto, {
      name: '  Store Name  ',
      email: '  STORE@EXAMPLE.COM ',
      address: ' Address ',
      ownerId: 'not-a-uuid',
      averageRating: 5,
    });

    expect(dto.name).toBe('Store Name');
    expect(dto.email).toBe('store@example.com');
    expect(dto.address).toBe('Address');
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    expect(errors.map(({ property }) => property)).toEqual(
      expect.arrayContaining(['ownerId', 'averageRating']),
    );
  });

  it('accepts a valid owner UUID and store email', async () => {
    const dto = plainToInstance(CreateStoreDto, {
      name: 'Store Name',
      email: 'store@example.com',
      address: 'Address',
      ownerId: 'a8098c1a-f86e-11da-bd1a-00112444be1e',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects an unsafe sort field and invalid pagination', async () => {
    const dto = plainToInstance(ListStoresDto, {
      sortBy: 'rating; DROP TABLE stores',
      sortOrder: 'RANDOM',
      limit: 101,
      page: 0,
    });

    const errors = await validate(dto);
    expect(errors.map(({ property }) => property)).toEqual(
      expect.arrayContaining(['sortBy', 'sortOrder', 'limit', 'page']),
    );
  });

  it('sets safe pagination and sorting defaults', async () => {
    const dto = plainToInstance(ListStoresDto, {});

    expect(dto).toMatchObject({
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'DESC',
    });
    await expect(validate(dto)).resolves.toHaveLength(0);
  });
});
