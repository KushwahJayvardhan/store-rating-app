import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateRatingDto, UpdateRatingDto } from './rating.dto';

describe('rating DTO validation', () => {
  it.each([1, 5])('accepts rating value %s', async (value) => {
    const dto = plainToInstance(UpdateRatingDto, { value });
    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it.each([0, 6, 2.5, 'not-a-number'])(
    'rejects rating value %s',
    async (value) => {
      const dto = plainToInstance(UpdateRatingDto, { value });
      await expect(validate(dto)).resolves.not.toHaveLength(0);
    },
  );

  it('requires a store UUID when creating a rating', async () => {
    const dto = plainToInstance(CreateRatingDto, {
      storeId: 'not-a-uuid',
      value: 3,
    });
    const errors = await validate(dto);
    expect(errors.map(({ property }) => property)).toContain('storeId');
  });
});
