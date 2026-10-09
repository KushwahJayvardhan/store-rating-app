import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { RatingsModule } from './ratings/ratings.module';
import { StoresModule } from './stores/stores.module';
import { UsersModule } from './users/users.module';

dotenv.config();

const isDatabaseConfigured =
  Boolean(process.env.DB_HOST) ||
  Boolean(process.env.DB_NAME) ||
  Boolean(process.env.DB_USERNAME);

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ...(isDatabaseConfigured
      ? [
          TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
              type: 'postgres',
              host: configService.get<string>('DB_HOST', 'localhost'),
              port: Number(configService.get<number>('DB_PORT', 5432)),
              username: configService.get<string>('DB_USERNAME', 'postgres'),
              password: configService.get<string>('DB_PASSWORD', 'postgres'),
              database: configService.get<string>(
                'DB_NAME',
                'store_rating_app',
              ),
              entities: [join(__dirname, '**', '*.entity.{ts,js}')],
              migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
              synchronize: false,
              logging:
                configService.get<string>('NODE_ENV', 'development') ===
                'development',
              migrationsRun: false,
            }),
          }),
        ]
      : []),
    ...(isDatabaseConfigured
      ? [AuthModule, UsersModule, StoresModule, RatingsModule]
      : []),
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
