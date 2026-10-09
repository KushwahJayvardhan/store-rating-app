import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserRole } from '../entities/user.entity';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';
import { StoreOwnershipGuard } from './store-ownership.guard';

@Controller('authorization-demo')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuthorizationDemoController {
  @Get('admin')
  @Roles(UserRole.SYSTEM_ADMIN)
  adminEndpoint() {
    return { access: 'system-admin' };
  }

  @Get('normal-user')
  @Roles(UserRole.NORMAL_USER)
  normalUserEndpoint() {
    return { access: 'normal-user' };
  }

  @Get('store-owner/stores/:storeId/ratings')
  @Roles(UserRole.STORE_OWNER)
  @UseGuards(StoreOwnershipGuard)
  storeOwnerRatingsEndpoint() {
    return { access: 'own-store-ratings' };
  }
}
