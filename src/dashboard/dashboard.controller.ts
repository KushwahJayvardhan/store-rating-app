import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../entities/user.entity';
import { DashboardService } from './dashboard.service';
import { ListStoreRatingsDto } from './dto/list-store-ratings.dto';
import { StoreOwnerDashboardService } from './store-owner-dashboard.service';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly storeOwnerDashboardService: StoreOwnerDashboardService,
  ) {}

  @Get('admin/dashboard')
  @Roles(UserRole.SYSTEM_ADMIN)
  getStatistics() {
    return this.dashboardService.getStatistics();
  }

  @Get('owner/dashboard')
  @Roles(UserRole.STORE_OWNER)
  getStoreOwnerDashboard(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListStoreRatingsDto,
  ) {
    return this.storeOwnerDashboardService.getDashboard(request.user.id, query);
  }
}
