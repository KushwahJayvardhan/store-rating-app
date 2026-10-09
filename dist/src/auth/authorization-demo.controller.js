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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthorizationDemoController = void 0;
const common_1 = require("@nestjs/common");
const user_entity_1 = require("../entities/user.entity");
const jwt_auth_guard_1 = require("./jwt-auth.guard");
const roles_decorator_1 = require("./roles.decorator");
const roles_guard_1 = require("./roles.guard");
const store_ownership_guard_1 = require("./store-ownership.guard");
let AuthorizationDemoController = class AuthorizationDemoController {
    adminEndpoint() {
        return { access: 'system-admin' };
    }
    normalUserEndpoint() {
        return { access: 'normal-user' };
    }
    storeOwnerRatingsEndpoint() {
        return { access: 'own-store-ratings' };
    }
};
exports.AuthorizationDemoController = AuthorizationDemoController;
__decorate([
    (0, common_1.Get)('admin'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SYSTEM_ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AuthorizationDemoController.prototype, "adminEndpoint", null);
__decorate([
    (0, common_1.Get)('normal-user'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.NORMAL_USER),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AuthorizationDemoController.prototype, "normalUserEndpoint", null);
__decorate([
    (0, common_1.Get)('store-owner/stores/:storeId/ratings'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.STORE_OWNER),
    (0, common_1.UseGuards)(store_ownership_guard_1.StoreOwnershipGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AuthorizationDemoController.prototype, "storeOwnerRatingsEndpoint", null);
exports.AuthorizationDemoController = AuthorizationDemoController = __decorate([
    (0, common_1.Controller)('authorization-demo'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard)
], AuthorizationDemoController);
//# sourceMappingURL=authorization-demo.controller.js.map