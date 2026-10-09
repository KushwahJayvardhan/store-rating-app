import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/auth.types';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../entities/user.entity';
import { ListRatedStoresDto } from './dto/list-rated-stores.dto';
import { CreateRatingDto, UpdateRatingDto } from './dto/rating.dto';
import { RatingsService } from './ratings.service';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.NORMAL_USER)
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Get('stores')
  listStores(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListRatedStoresDto,
  ) {
    return this.ratingsService.listStores(request.user.id, query);
  }

  @Post('ratings')
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateRatingDto,
  ) {
    return {
      data: await this.ratingsService.create(request.user.id, dto),
    };
  }

  @Patch('ratings/:ratingId')
  async update(
    @Req() request: AuthenticatedRequest,
    @Param('ratingId', new ParseUUIDPipe()) ratingId: string,
    @Body() dto: UpdateRatingDto,
  ) {
    return {
      data: await this.ratingsService.update(request.user.id, ratingId, dto),
    };
  }
}
