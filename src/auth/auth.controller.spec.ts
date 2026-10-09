import type { Request } from 'express';
import { AuthController } from './auth.controller';
import type { AuthenticatedUser } from './auth.types';
import type { ChangePasswordDto } from './dto/change-password.dto';

jest.mock('@nestjs/passport', () => ({
  AuthGuard: () =>
    class {
      canActivate(): boolean {
        return true;
      }
    },
}));

describe('AuthController password change', () => {
  it('uses the authenticated user identity, not a client-supplied ID', async () => {
    const authService = {
      changePassword: jest.fn().mockResolvedValue({
        message: 'Password updated successfully',
      }),
    };
    const controller = new AuthController(authService as never);
    const request = {
      user: { id: 'authenticated-user-id' } as AuthenticatedUser,
    } as Request & { user: AuthenticatedUser };
    const dto = {
      currentPassword: 'CurrentPass1!',
      newPassword: 'NewPassword2!',
      userId: 'attacker-selected-id',
    } as ChangePasswordDto;

    await expect(controller.changePassword(request, dto)).resolves.toEqual({
      message: 'Password updated successfully',
    });
    expect(authService.changePassword).toHaveBeenCalledWith(
      'authenticated-user-id',
      dto,
    );
    expect(authService.changePassword).not.toHaveBeenCalledWith(
      'attacker-selected-id',
      expect.anything(),
    );
  });
});
