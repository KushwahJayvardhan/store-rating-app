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
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

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
      'store-owner-token': { id: 'owner-id', role: UserRole.STORE_OWNER },
    };
    const user = roleByToken[token];

    if (!user) {
      throw new UnauthorizedException();
    }

    req.user = user;
    return true;
  }
}

describe('UsersController (admin access integration)', () => {
  let app: INestApplication<App>;
  let usersService: jest.Mocked<
    Pick<UsersService, 'create' | 'findAll' | 'findOne'>
  >;

  beforeAll(async () => {
    usersService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
    };
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersService }],
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

  it('returns 401 for unauthenticated user-list requests', async () => {
    await request(app.getHttpServer()).get('/api/admin/users').expect(401);
  });

  it('returns 403 when a normal user accesses user management', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/users')
      .set('Authorization', 'Bearer user-token')
      .expect(403);
    expect(usersService.findAll.mock.calls).toHaveLength(0);
  });

  it('allows admins to list users and validates list parameters', async () => {
    usersService.findAll.mockResolvedValue({
      data: [],
      meta: { page: 2, limit: 5, total: 0, totalPages: 0 },
    });

    await request(app.getHttpServer())
      .get('/api/admin/users?sortBy=email&sortOrder=asc&page=2&limit=5')
      .set('Authorization', 'Bearer admin-token')
      .expect(200)
      .expect({
        data: [],
        meta: { page: 2, limit: 5, total: 0, totalPages: 0 },
      });

    expect(usersService.findAll.mock.calls[0][0]).toMatchObject({
      sortBy: 'email',
      sortOrder: 'ASC',
      page: 2,
      limit: 5,
    });
  });

  it('rejects invalid create-user input and does not call the service', async () => {
    await request(app.getHttpServer())
      .post('/api/admin/users')
      .set('Authorization', 'Bearer admin-token')
      .send({
        name: 'Short',
        email: 'invalid',
        address: 'Address',
        password: 'weak',
        role: UserRole.STORE_OWNER,
      })
      .expect(400);

    expect(usersService.create.mock.calls).toHaveLength(0);
  });

  it('prevents non-admin users from creating a store owner', async () => {
    await request(app.getHttpServer())
      .post('/api/admin/users')
      .set('Authorization', 'Bearer user-token')
      .send({
        name: 'A Valid Person With A Long Name',
        email: 'owner@example.com',
        address: 'Address',
        password: 'Password1!',
        role: UserRole.STORE_OWNER,
      })
      .expect(403);

    expect(usersService.create.mock.calls).toHaveLength(0);
  });

  it('allows admins to create a store owner', async () => {
    usersService.create.mockResolvedValue({
      id: 'owner-id',
      name: 'A Valid Person With A Long Name',
      email: 'owner@example.com',
      address: 'Address',
      role: UserRole.STORE_OWNER,
    });

    await request(app.getHttpServer())
      .post('/api/admin/users')
      .set('Authorization', 'Bearer admin-token')
      .send({
        name: 'A Valid Person With A Long Name',
        email: 'owner@example.com',
        address: 'Address',
        password: 'Password1!',
        role: UserRole.STORE_OWNER,
      })
      .expect(201)
      .expect({
        data: {
          id: 'owner-id',
          name: 'A Valid Person With A Long Name',
          email: 'owner@example.com',
          address: 'Address',
          role: UserRole.STORE_OWNER,
        },
      });

    expect(usersService.create.mock.calls[0][0].role).toBe(
      UserRole.STORE_OWNER,
    );
  });

  it('returns created user data without a password', async () => {
    usersService.create.mockResolvedValue({
      id: 'created-id',
      name: 'A Valid Person With A Long Name',
      email: 'person@example.com',
      address: 'Address',
      role: UserRole.NORMAL_USER,
    });

    await request(app.getHttpServer())
      .post('/api/admin/users')
      .set('Authorization', 'Bearer admin-token')
      .send({
        name: 'A Valid Person With A Long Name',
        email: 'person@example.com',
        address: 'Address',
        password: 'Password1!',
        role: UserRole.NORMAL_USER,
      })
      .expect(201)
      .expect({
        data: {
          id: 'created-id',
          name: 'A Valid Person With A Long Name',
          email: 'person@example.com',
          address: 'Address',
          role: UserRole.NORMAL_USER,
        },
      });
  });
});
