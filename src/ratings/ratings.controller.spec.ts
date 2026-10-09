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
import { UserRole } from '../entities/user.entity';
import type { AuthenticatedUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RatingsController } from './ratings.controller';
import { RatingsService } from './ratings.service';

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
    const authorization = req.headers.authorization;
    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length)
      : '';
    const userByToken: Record<string, AuthenticatedUser> = {
      'normal-user-token': { id: 'normal-user-id', role: UserRole.NORMAL_USER },
      'admin-token': { id: 'admin-id', role: UserRole.SYSTEM_ADMIN },
      'store-owner-token': {
        id: 'store-owner-id',
        role: UserRole.STORE_OWNER,
      },
    };
    const user = userByToken[token];

    if (!user) {
      throw new UnauthorizedException();
    }
    req.user = user;
    return true;
  }
}

describe('RatingsController (authorization integration)', () => {
  let app: INestApplication<App>;
  let ratingsService: jest.Mocked<
    Pick<RatingsService, 'create' | 'update' | 'listStores'>
  >;

  beforeAll(async () => {
    ratingsService = {
      create: jest.fn(),
      update: jest.fn(),
      listStores: jest.fn(),
    };
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [RatingsController],
      providers: [{ provide: RatingsService, useValue: ratingsService }],
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

  it('returns 401 for unauthenticated rating requests', async () => {
    await request(app.getHttpServer())
      .post('/api/ratings')
      .send({
        storeId: 'a8098c1a-f86e-11da-bd1a-00112444be1e',
        value: 1,
      })
      .expect(401);
  });

  it.each(['admin-token', 'store-owner-token'])(
    'returns 403 when a non-normal-user role submits a rating',
    async (token) => {
      await request(app.getHttpServer())
        .post('/api/ratings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          storeId: 'a8098c1a-f86e-11da-bd1a-00112444be1e',
          value: 1,
        })
        .expect(403);
    },
  );

  it.each([0, 6])(
    'rejects rating value %s at the API boundary',
    async (value) => {
      await request(app.getHttpServer())
        .post('/api/ratings')
        .set('Authorization', 'Bearer normal-user-token')
        .send({
          storeId: 'a8098c1a-f86e-11da-bd1a-00112444be1e',
          value,
        })
        .expect(400);
      expect(ratingsService.create.mock.calls).toHaveLength(0);
    },
  );

  it('passes the authenticated user ID when submitting a rating', async () => {
    ratingsService.create.mockResolvedValue({
      id: 'rating-id',
      storeId: 'a8098c1a-f86e-11da-bd1a-00112444be1e',
      value: 1,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    await request(app.getHttpServer())
      .post('/api/ratings')
      .set('Authorization', 'Bearer normal-user-token')
      .send({
        storeId: 'a8098c1a-f86e-11da-bd1a-00112444be1e',
        value: 1,
      })
      .expect(201);

    expect(ratingsService.create.mock.calls[0]).toMatchObject([
      'normal-user-id',
      {
        storeId: 'a8098c1a-f86e-11da-bd1a-00112444be1e',
        value: 1,
      },
    ]);
  });
});
