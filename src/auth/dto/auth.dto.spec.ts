import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LoginDto } from './login.dto';
import { RegisterDto } from './register.dto';
import { ChangePasswordDto } from './change-password.dto';

describe('authentication DTO validation', () => {
  it('normalizes registration email and accepts valid registration data', async () => {
    const dto = plainToInstance(RegisterDto, {
      name: '  A Valid Person With A Long Name  ',
      email: '  PERSON@example.com ',
      address: ' Somewhere ',
      password: 'Password1!',
    });

    expect(dto.name).toBe('A Valid Person With A Long Name');
    expect(dto.email).toBe('person@example.com');
    expect(dto.address).toBe('Somewhere');
    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects invalid registration fields', async () => {
    const dto = plainToInstance(RegisterDto, {
      name: 'Short',
      email: 'not-an-email',
      address: 'x'.repeat(401),
      password: 'weak',
      role: 'ADMIN',
    });

    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    expect(errors.map(({ property }) => property)).toEqual(
      expect.arrayContaining(['name', 'email', 'address', 'password', 'role']),
    );
  });

  it('rejects an invalid registration email', async () => {
    const dto = plainToInstance(RegisterDto, {
      name: 'A Valid Person With A Long Name',
      email: 'not-an-email',
      address: 'Somewhere',
      password: 'Password1!',
    });

    const errors = await validate(dto);
    expect(errors.map(({ property }) => property)).toContain('email');
  });

  it('rejects a registration password without the required format', async () => {
    const dto = plainToInstance(RegisterDto, {
      name: 'A Valid Person With A Long Name',
      email: 'person@example.com',
      address: 'Somewhere',
      password: 'password1',
    });

    const errors = await validate(dto);
    expect(errors.map(({ property }) => property)).toContain('password');
  });

  it('validates login email and requires a password', async () => {
    const dto = plainToInstance(LoginDto, {
      email: 'invalid',
      password: '',
    });

    const errors = await validate(dto);
    expect(errors.map(({ property }) => property)).toEqual(
      expect.arrayContaining(['email', 'password']),
    );
  });

  it('requires both current password and a valid new password', async () => {
    const dto = plainToInstance(ChangePasswordDto, {
      currentPassword: '',
      newPassword: 'weak',
      userId: 'another-user',
    });

    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    expect(errors.map(({ property }) => property)).toEqual(
      expect.arrayContaining(['currentPassword', 'newPassword', 'userId']),
    );
  });

  it('accepts a new password matching the established password requirements', async () => {
    const dto = plainToInstance(ChangePasswordDto, {
      currentPassword: 'CurrentPass1!',
      newPassword: 'NewPassword2!',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });
});
