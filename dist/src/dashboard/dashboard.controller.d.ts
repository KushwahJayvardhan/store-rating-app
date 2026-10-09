import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getStatistics(): Promise<import("./dashboard.service").DashboardStatistics>;
}
