"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const user_entity_1 = require("../entities/user.entity");
const dashboard_service_1 = require("./dashboard.service");
const list_store_ratings_dto_1 = require("./dto/list-store-ratings.dto");
const store_owner_dashboard_service_1 = require("./store-owner-dashboard.service");
let DashboardController = class DashboardController {
    dashboardService;
    storeOwnerDashboardService;
    constructor(dashboardService, storeOwnerDashboardService) {
        this.dashboardService = dashboardService;
        this.storeOwnerDashboardService = storeOwnerDashboardService;
    }
    getStatistics() {
        return this.dashboardService.getStatistics();
    }
    getStoreOwnerDashboard(request, query) {
        return this.storeOwnerDashboardService.getDashboard(request.user.id, query);
    }
};
exports.DashboardController = DashboardController;
__decorate([
    (0, common_1.Get)('admin/dashboard'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SYSTEM_ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getStatistics", null);
__decorate([
    (0, common_1.Get)('owner/dashboard'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.STORE_OWNER),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, list_store_ratings_dto_1.ListStoreRatingsDto]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getStoreOwnerDashboard", null);
exports.DashboardController = DashboardController = __decorate([
    (0, common_1.Controller)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [dashboard_service_1.DashboardService,
        store_owner_dashboard_service_1.StoreOwnerDashboardService])
], DashboardController);
//# sourceMappingURL=dashboard.controller.js.map