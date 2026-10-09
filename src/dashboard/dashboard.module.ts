import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Rating } from '../entities/rating.entity';
import { Store } from '../entities/store.entity';
import { User } from '../entities/user.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { StoreOwnerDashboardService } from './store-owner-dashboard.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Store, Rating]), AuthModule],
  controllers: [DashboardController],
  providers: [DashboardService, StoreOwnerDashboardService],
})
export class DashboardModule {}
