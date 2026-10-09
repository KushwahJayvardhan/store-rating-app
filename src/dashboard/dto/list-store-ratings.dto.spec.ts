import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ListStoreRatingsDto } from './list-store-ratings.dto';

describe('ListStoreRatingsDto', () => {
  it('rejects pages above the maximum', async () => {
    const dto = plainToInstance(ListStoreRatingsDto, { page: 1001 });

    expect((await validate(dto)).map(({ property }) => property)).toContain(
      'page',
    );
  });
});
