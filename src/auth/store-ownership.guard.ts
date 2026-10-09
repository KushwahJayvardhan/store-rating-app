import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Store } from '../entities/store.entity';
import type { AuthenticatedUser } from './auth.types';
import { STORE_REPOSITORY } from './auth.tokens';

export interface StoreOwnershipRepository {
  findOneBy(criteria: { id: string; ownerId: string }): Promise<Store | null>;
}

interface StoreRequest {
  params: { storeId?: string };
  user?: AuthenticatedUser;
}

@Injectable()
export class StoreOwnershipGuard implements CanActivate {
  constructor(
    @Inject(STORE_REPOSITORY)
    private readonly storesRepository: StoreOwnershipRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<StoreRequest>();
    const storeId = request.params.storeId;

    if (!storeId || !request.user) {
      throw new NotFoundException('Store not found');
    }

    const store = await this.storesRepository.findOneBy({
      id: storeId,
      ownerId: request.user.id,
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    return true;
  }
}
