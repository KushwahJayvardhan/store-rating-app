import {
  CanActivate,
  Controller,
  ExecutionContext,
  Get,
  INestApplication,
  Injectable,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { Store } from '../entities/store.entity';
import { UserRole } from '../entities/user.entity';
import type { AuthenticatedUser } from './auth.types';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';
import {
  StoreOwnershipGuard,
  type StoreOwnershipRepository,
} from './store-ownership.guard';
import { STORE_REPOSITORY } from './auth.tokens';

interface TestRequest {
  headers: Record<string, string | undefined>;
  user?: AuthenticatedUser;
}

@Injectable()
class TestAuthGuard implements CanActivate {
  private readonly usersByToken: Record<string, AuthenticatedUser> = {
    'normal-user-token': { id: 'normal-user-id', role: UserRole.NORMAL_USER },
    'admin-token': { id: 'admin-id', role: UserRole.SYSTEM_ADMIN },
    'store-owner-token': { id: 'owner-id', role: UserRole.STORE_OWNER },
  };

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<TestRequest>();
    const authorization = req.headers.authorization;
    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length)
      : '';
    const user = this.usersByToken[token];

    if (!user) {
      throw new UnauthorizedException();
    }

    req.user = user;
    return true;
  }
}

@Controller('authorization-demo')
@UseGuards(TestAuthGuard, RolesGuard)
class TestAuthorizationController {
  @Get('admin')
  @Roles(UserRole.SYSTEM_ADMIN)
  adminEndpoint() {
    return { access: 'system-admin' };
  }

  @Get('normal-user')
  @Roles(UserRole.NORMAL_USER)
  normalUserEndpoint() {
    return { access: 'normal-user' };
  }

  @Get('store-owner/stores/:storeId/ratings')
  @Roles(UserRole.STORE_OWNER)
  @UseGuards(StoreOwnershipGuard)
  storeOwnerRatingsEndpoint() {
    return { access: 'own-store-ratings' };
  }
}

describe('Role authorization (integration)', () => {
  let app: INestApplication<App>;
  let storesRepository: jest.Mocked<StoreOwnershipRepository>;

  beforeAll(async () => {
    storesRepository = { findOneBy: jest.fn() };
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TestAuthorizationController],
      providers: [
        TestAuthGuard,
        RolesGuard,
        StoreOwnershipGuard,
        { provide: STORE_REPOSITORY, useValue: storesRepository },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when a protected endpoint has no authentication token', async () => {
    await request(app.getHttpServer())
      .get('/authorization-demo/admin')
      .expect(401);
  });

  it('allows a normal user to access a normal-user endpoint', async () => {
    await request(app.getHttpServer())
      .get('/authorization-demo/normal-user')
      .set('Authorization', 'Bearer normal-user-token')
      .expect(200)
      .expect({ access: 'normal-user' });
  });

  it('allows a system administrator to access an admin endpoint', async () => {
    await request(app.getHttpServer())
      .get('/authorization-demo/admin')
      .set('Authorization', 'Bearer admin-token')
      .expect(200)
      .expect({ access: 'system-admin' });
  });

  it('allows a store owner to access their own store rating endpoint', async () => {
    storesRepository.findOneBy.mockResolvedValue({
      id: 'store-id',
      ownerId: 'owner-id',
    } as Store);

    await request(app.getHttpServer())
      .get('/authorization-demo/store-owner/stores/store-id/ratings')
      .set('Authorization', 'Bearer store-owner-token')
      .expect(200)
      .expect({ access: 'own-store-ratings' });

    expect(storesRepository.findOneBy.mock.calls[0][0]).toEqual({
      id: 'store-id',
      ownerId: 'owner-id',
    });
  });

  it('returns 403 when an authenticated user has the wrong role', async () => {
    await request(app.getHttpServer())
      .get('/authorization-demo/admin')
      .set('Authorization', 'Bearer normal-user-token')
      .expect(403);
  });

  it("does not allow a store owner to access another owner's ratings", async () => {
    storesRepository.findOneBy.mockResolvedValue(null);

    await request(app.getHttpServer())
      .get('/authorization-demo/store-owner/stores/another-store/ratings')
      .set('Authorization', 'Bearer store-owner-token')
      .expect(404);

    expect(storesRepository.findOneBy.mock.calls[0][0]).toEqual({
      id: 'another-store',
      ownerId: 'owner-id',
    });
  });
});
