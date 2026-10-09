import { ExecutionContext, NotFoundException } from '@nestjs/common';
import { Store } from '../entities/store.entity';
import { UserRole } from '../entities/user.entity';
import { StoreOwnershipGuard, StoreOwnershipRepository } from './store-ownership.guard';

describe('StoreOwnershipGuard', () => {
  let storesRepository: jest.Mocked<StoreOwnershipRepository>;
  let guard: StoreOwnershipGuard;

  beforeEach(() => {
    storesRepository = { findOneBy: jest.fn() };
    guard = new StoreOwnershipGuard(storesRepository);
  });

  function contextFor(storeId: string, userId: string): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          params: { storeId },
          user: {
            id: userId,
            email: 'owner@example.com',
            role: UserRole.STORE_OWNER,
          },
        }),
      }),
    } as unknown as ExecutionContext;
  }

  it('permits an owner to access their own store rating endpoint', async () => {
    const store = { id: 'store-1', ownerId: 'owner-1' } as Store;
    storesRepository.findOneBy.mockResolvedValue(store);

    await expect(
      guard.canActivate(contextFor('store-1', 'owner-1')),
    ).resolves.toBe(true);
    expect(storesRepository.findOneBy).toHaveBeenCalledWith({
      id: 'store-1',
      ownerId: 'owner-1',
    });
  });

  it('hides another owner store and does not authorize rating access', async () => {
    storesRepository.findOneBy.mockResolvedValue(null);

    await expect(
      guard.canActivate(contextFor('other-store', 'owner-1')),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(storesRepository.findOneBy).toHaveBeenCalledWith({
      id: 'other-store',
      ownerId: 'owner-1',
    });
  });
});
