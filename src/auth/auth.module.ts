import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Store } from '../entities/store.entity';
import { AuthorizationDemoController } from './authorization-demo.controller';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import {
  AUTH_USER_REPOSITORY,
  JWT_TOKEN_SIGNER,
  STORE_REPOSITORY,
} from './auth.tokens';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';
import { RolesGuard } from './roles.guard';
import { StoreOwnershipGuard } from './store-ownership.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Store]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: Number(
            configService.get<number>('JWT_EXPIRES_IN_SECONDS', 3600),
          ),
        },
      }),
    }),
  ],
  controllers: [AuthController, AuthorizationDemoController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
    StoreOwnershipGuard,
    { provide: JWT_TOKEN_SIGNER, useExisting: JwtService },
    {
      provide: AUTH_USER_REPOSITORY,
      useExisting: getRepositoryToken(User),
    },
    {
      provide: STORE_REPOSITORY,
      useExisting: getRepositoryToken(Store),
    },
  ],
  exports: [AuthService, JwtAuthGuard, RolesGuard, StoreOwnershipGuard],
})
export class AuthModule {}
