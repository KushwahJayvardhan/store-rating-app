import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../entities/user.entity';
import { AuthService } from './auth.service';
import type { JwtTokenSigner, UserRepository } from './auth.types';

describe('AuthService', () => {
  let authService: AuthService;
  let usersRepository: jest.Mocked<UserRepository>;
  let jwtService: jest.Mocked<JwtTokenSigner>;

  beforeEach(() => {
    usersRepository = {
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed.jwt.token'),
    };

    authService = new AuthService(usersRepository, jwtService);
  });

  it('registers a normal user with a bcrypt hash and returns no password hash', async () => {
    usersRepository.findOneBy.mockResolvedValue(null);
    usersRepository.create.mockImplementation((user) => user as User);
    const createdUser = {
      id: 'user-id',
      name: 'A Valid Person With A Long Name',
      email: 'person@example.com',
      address: 'Somewhere',
      passwordHash: await bcrypt.hash('Password1!', 4),
      role: UserRole.NORMAL_USER,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User;
    usersRepository.save.mockResolvedValue(createdUser);

    const result = await authService.register({
      name: 'A Valid Person With A Long Name',
      email: 'PERSON@example.com',
      address: 'Somewhere',
      password: 'Password1!',
    });

    expect(usersRepository.create.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        email: 'person@example.com',
        role: UserRole.NORMAL_USER,
      }),
    );
    const savedUser = usersRepository.save.mock.calls[0][0];
    expect(savedUser.passwordHash).not.toBe('Password1!');
    expect(await bcrypt.compare('Password1!', savedUser.passwordHash)).toBe(
      true,
    );
    expect(result.user).not.toHaveProperty('passwordHash');
    expect(result.accessToken).toBe('signed.jwt.token');
    expect(jwtService.signAsync.mock.calls[0][0]).toEqual({
      sub: createdUser.id,
      role: UserRole.NORMAL_USER,
    });
  });

  it('rejects duplicate registration emails', async () => {
    usersRepository.findOneBy.mockResolvedValue({ id: 'existing' } as User);

    await expect(
      authService.register({
        name: 'A Valid Person With A Long Name',
        email: 'person@example.com',
        address: 'Somewhere',
        password: 'Password1!',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(usersRepository.save.mock.calls).toHaveLength(0);
  });

  it('returns a token when credentials are valid', async () => {
    const user = {
      id: 'user-id',
      name: 'A Valid Person With A Long Name',
      email: 'person@example.com',
      address: 'Somewhere',
      passwordHash: await bcrypt.hash('Password1!', 4),
      role: UserRole.NORMAL_USER,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User;
    usersRepository.findOneBy.mockResolvedValue(user);

    await expect(
      authService.login({
        email: 'PERSON@example.com',
        password: 'Password1!',
      }),
    ).resolves.toMatchObject({
      accessToken: 'signed.jwt.token',
      user: { id: 'user-id', email: 'person@example.com' },
    });
  });

  it('rejects a nonexistent user with a generic error', async () => {
    usersRepository.findOneBy.mockResolvedValue(null);

    await expect(
      authService.login({
        email: 'person@example.com',
        password: 'wrong',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(jwtService.signAsync.mock.calls).toHaveLength(0);
  });

  it('rejects an incorrect password with the same generic error', async () => {
    usersRepository.findOneBy.mockResolvedValue({
      id: 'user-id',
      passwordHash: await bcrypt.hash('Password1!', 4),
    } as User);

    await expect(
      authService.login({
        email: 'person@example.com',
        password: 'WrongPassword1!',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(jwtService.signAsync.mock.calls).toHaveLength(0);
  });
});
