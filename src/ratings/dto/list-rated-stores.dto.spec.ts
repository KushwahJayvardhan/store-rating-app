import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ListRatedStoresDto } from './list-rated-stores.dto';

describe('ListRatedStoresDto', () => {
  it('rejects pages above the maximum', async () => {
    const dto = plainToInstance(ListRatedStoresDto, { page: 1001 });

    expect((await validate(dto)).map(({ property }) => property)).toContain(
      'page',
    );
  });
});
