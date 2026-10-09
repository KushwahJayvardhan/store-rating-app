import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../entities/user.entity';
import { AuthenticatedUser } from './auth.types';
import { ROLES_KEY } from './roles.decorator';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let reflector: jest.Mocked<Pick<Reflector, 'getAllAndOverride'>>;
  let guard: RolesGuard;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    };
    guard = new RolesGuard(reflector as Reflector);
  });

  function contextFor(user?: AuthenticatedUser): ExecutionContext {
    const handler = jest.fn();
    const controller = jest.fn();
    return {
      getHandler: () => handler,
      getClass: () => controller,
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  it('allows a user whose role is listed in route metadata', () => {
    reflector.getAllAndOverride.mockReturnValue([
      UserRole.NORMAL_USER,
      UserRole.STORE_OWNER,
    ]);

    expect(
      guard.canActivate(
        contextFor({
          id: 'user-id',
          role: UserRole.NORMAL_USER,
        }),
      ),
    ).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
      expect.any(Function),
      expect.any(Function),
    ]);
  });

  it('returns 403 for a user with a role not listed in route metadata', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.SYSTEM_ADMIN]);

    expect(() =>
      guard.canActivate(
        contextFor({
          id: 'user-id',
          role: UserRole.NORMAL_USER,
        }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('returns 401 when no authenticated user is present', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.STORE_OWNER]);

    expect(() => guard.canActivate(contextFor())).toThrow(
      UnauthorizedException,
    );
  });

  it('allows access when no role metadata is defined', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    expect(guard.canActivate(contextFor())).toBe(true);
  });

  it.each([UserRole.NORMAL_USER, UserRole.SYSTEM_ADMIN, UserRole.STORE_OWNER])(
    'allows an authenticated %s role when listed',
    (role) => {
      reflector.getAllAndOverride.mockReturnValue([role]);

      expect(
        guard.canActivate(
          contextFor({
            id: 'user-id',
            role,
          }),
        ),
      ).toBe(true);
    },
  );
});
