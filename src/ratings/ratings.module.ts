import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Rating } from '../entities/rating.entity';
import { Store } from '../entities/store.entity';
import { RatingsController } from './ratings.controller';
import { RatingsService } from './ratings.service';

@Module({
  imports: [TypeOrmModule.forFeature([Rating, Store]), AuthModule],
  controllers: [RatingsController],
  providers: [RatingsService],
})
export class RatingsModule {}
