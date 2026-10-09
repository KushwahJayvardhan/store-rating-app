import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UserRole } from '../../entities/user.entity';
import { CreateAdminUserDto } from './create-admin-user.dto';
import { ListUsersDto } from './list-users.dto';

describe('user management DTO validation', () => {
  it('accepts admin and normal user creation but rejects store-owner creation', async () => {
    const payload = {
      name: '  A Valid Person With A Long Name  ',
      email: '  PERSON@example.com ',
      address: ' Address ',
      password: 'Password1!',
    };
    const valid = plainToInstance(CreateAdminUserDto, {
      ...payload,
      role: UserRole.SYSTEM_ADMIN,
    });
    const invalid = plainToInstance(CreateAdminUserDto, {
      ...payload,
      role: UserRole.STORE_OWNER,
    });

    expect(valid.name).toBe('A Valid Person With A Long Name');
    expect(valid.email).toBe('person@example.com');
    await expect(validate(valid)).resolves.toHaveLength(0);
    expect((await validate(invalid)).map(({ property }) => property)).toContain(
      'role',
    );
  });

  it('rejects invalid fields and unsafe sort/filter values', async () => {
    const dto = plainToInstance(ListUsersDto, {
      name: 'x'.repeat(61),
      role: 'ROOT',
      sortBy: 'name; DROP TABLE users',
      sortOrder: 'SIDEWAYS',
      page: 0,
      limit: 101,
    });

    const errors = await validate(dto);
    expect(errors.map(({ property }) => property)).toEqual(
      expect.arrayContaining([
        'name',
        'role',
        'sortBy',
        'sortOrder',
        'page',
        'limit',
      ]),
    );
  });

  it('applies pagination and sort defaults and normalizes sort order', async () => {
    const dto = plainToInstance(ListUsersDto, { sortOrder: 'asc' });

    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(20);
    expect(dto.sortBy).toBe('createdAt');
    expect(dto.sortOrder).toBe('ASC');
    await expect(validate(dto)).resolves.toHaveLength(0);
  });
});
