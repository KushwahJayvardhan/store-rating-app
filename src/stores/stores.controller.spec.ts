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
import { StoresController } from './stores.controller';
import { StoresService } from './stores.service';

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
    const roleByToken: Record<string, AuthenticatedUser> = {
      'admin-token': { id: 'admin-id', role: UserRole.SYSTEM_ADMIN },
      'user-token': { id: 'user-id', role: UserRole.NORMAL_USER },
    };
    const user = roleByToken[token];

    if (!user) {
      throw new UnauthorizedException();
    }
    req.user = user;
    return true;
  }
}

describe('StoresController (admin access integration)', () => {
  let app: INestApplication<App>;
  let storesService: jest.Mocked<
    Pick<StoresService, 'create' | 'findAll' | 'findOne'>
  >;

  beforeAll(async () => {
    storesService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
    };
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [StoresController],
      providers: [{ provide: StoresService, useValue: storesService }],
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

  it('returns 401 to unauthenticated users', async () => {
    await request(app.getHttpServer()).get('/api/admin/stores').expect(401);
  });

  it('returns 403 to non-admin users', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/stores')
      .set('Authorization', 'Bearer user-token')
      .expect(403);
    expect(storesService.findAll.mock.calls).toHaveLength(0);
  });

  it('rejects invalid store input and arbitrary average ratings', async () => {
    await request(app.getHttpServer())
      .post('/api/admin/stores')
      .set('Authorization', 'Bearer admin-token')
      .send({
        name: 'Store Name',
        email: 'not-an-email',
        address: 'Address',
        ownerId: 'invalid-id',
        averageRating: 5,
      })
      .expect(400);
    expect(storesService.create.mock.calls).toHaveLength(0);
  });

  it('allows admins to create a validated store', async () => {
    storesService.create.mockResolvedValue({
      id: 'store-id',
      name: 'Store Name',
      email: 'store@example.com',
      address: 'Address',
      owner: {
        id: 'owner-id',
        name: 'Owner Person',
        email: 'owner@example.com',
      },
      averageRating: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    await request(app.getHttpServer())
      .post('/api/admin/stores')
      .set('Authorization', 'Bearer admin-token')
      .send({
        name: 'Store Name',
        email: 'store@example.com',
        address: 'Address',
        ownerId: 'a8098c1a-f86e-11da-bd1a-00112444be1e',
      })
      .expect(201)
      .expect({
        data: {
          id: 'store-id',
          name: 'Store Name',
          email: 'store@example.com',
          address: 'Address',
          owner: {
            id: 'owner-id',
            name: 'Owner Person',
            email: 'owner@example.com',
          },
          averageRating: null,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      });
  });
});
