import type { Request } from 'express';
import type { AuthenticatedUser } from '../auth/auth.types';
import { DashboardService } from './dashboard.service';
import { ListStoreRatingsDto } from './dto/list-store-ratings.dto';
import { StoreOwnerDashboardService } from './store-owner-dashboard.service';
type AuthenticatedRequest = Request & {
    user: AuthenticatedUser;
};
export declare class DashboardController {
    private readonly dashboardService;
    private readonly storeOwnerDashboardService;
    constructor(dashboardService: DashboardService, storeOwnerDashboardService: StoreOwnerDashboardService);
    getStatistics(): Promise<import("./dashboard.service").DashboardStatistics>;
    getStoreOwnerDashboard(request: AuthenticatedRequest, query: ListStoreRatingsDto): Promise<import("./store-owner-dashboard.service").StoreOwnerDashboard>;
}
export {};
