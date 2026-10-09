import 'reflect-metadata';
import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import type { AuthenticatedUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserRole } from '../entities/user.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { StoreOwnerDashboardService } from './store-owner-dashboard.service';

jest.mock('@nestjs/passport', () => ({
  AuthGuard: () =>
    class {
      canActivate(): boolean {
        return true;
      }
    },
}));
jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => undefined,
}));

interface RequestWithAuth {
  headers: Record<string, string | undefined>;
  user?: AuthenticatedUser;
}

class TestAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<RequestWithAuth>();
    const token = req.headers.authorization?.replace(/^Bearer /, '');
    if (token === 'admin-token') {
      req.user = { id: 'admin-id', role: UserRole.SYSTEM_ADMIN };
      return true;
    }
    if (token === 'user-token') {
      req.user = { id: 'user-id', role: UserRole.NORMAL_USER };
      return true;
    }
    if (token === 'owner-token') {
      req.user = { id: 'owner-id', role: UserRole.STORE_OWNER };
      return true;
    }
    throw new UnauthorizedException();
  }
}

describe('DashboardController (authorization integration)', () => {
  let app: INestApplication<App>;
  let dashboardService: jest.Mocked<Pick<DashboardService, 'getStatistics'>>;
  let storeOwnerDashboardService: jest.Mocked<
    Pick<StoreOwnerDashboardService, 'getDashboard'>
  >;

  beforeAll(async () => {
    dashboardService = { getStatistics: jest.fn() };
    storeOwnerDashboardService = { getDashboard: jest.fn() };
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        { provide: DashboardService, useValue: dashboardService },
        {
          provide: StoreOwnerDashboardService,
          useValue: storeOwnerDashboardService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(TestAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 for an unauthenticated request', async () => {
    await request(app.getHttpServer()).get('/api/admin/dashboard').expect(401);
  });

  it('returns 403 to an authenticated non-admin', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/dashboard')
      .set('Authorization', 'Bearer user-token')
      .expect(403);
    expect(dashboardService.getStatistics.mock.calls).toHaveLength(0);
  });

  it('returns clean dashboard counts to a system administrator', async () => {
    dashboardService.getStatistics.mockResolvedValue({
      totalUsers: 12,
      totalStores: 4,
      totalRatings: 27,
    });

    await request(app.getHttpServer())
      .get('/api/admin/dashboard')
      .set('Authorization', 'Bearer admin-token')
      .expect(200)
      .expect({
        totalUsers: 12,
        totalStores: 4,
        totalRatings: 27,
      });

    expect(dashboardService.getStatistics.mock.calls).toHaveLength(1);
  });

  it('only allows store owners to view the owner dashboard', async () => {
    await request(app.getHttpServer())
      .get('/api/owner/dashboard')
      .set('Authorization', 'Bearer admin-token')
      .expect(403);
    expect(storeOwnerDashboardService.getDashboard.mock.calls).toHaveLength(0);
  });

  it('uses the authenticated owner ID and paginates their own dashboard', async () => {
    storeOwnerDashboardService.getDashboard.mockResolvedValue({
      averageRating: 4.5,
      ratings: [
        {
          name: 'A Rated User',
          email: 'rated@example.com',
          address: 'User Address',
          rating: 5,
          submittedAt: new Date('2026-01-01T00:00:00.000Z'),
        },
      ],
      meta: { page: 2, limit: 5, total: 6, totalPages: 2 },
    });

    await request(app.getHttpServer())
      .get('/api/owner/dashboard?page=2&limit=5&sortBy=name&sortOrder=asc')
      .set('Authorization', 'Bearer owner-token')
      .expect(200)
      .expect({
        averageRating: 4.5,
        ratings: [
          {
            name: 'A Rated User',
            email: 'rated@example.com',
            address: 'User Address',
            rating: 5,
            submittedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
        meta: { page: 2, limit: 5, total: 6, totalPages: 2 },
      });

    expect(storeOwnerDashboardService.getDashboard.mock.calls[0]).toMatchObject(
      ['owner-id', { page: 2, limit: 5, sortBy: 'name', sortOrder: 'ASC' }],
    );
  });
});
