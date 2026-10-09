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
exports.RatingsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const user_entity_1 = require("../entities/user.entity");
const list_rated_stores_dto_1 = require("./dto/list-rated-stores.dto");
const rating_dto_1 = require("./dto/rating.dto");
const ratings_service_1 = require("./ratings.service");
let RatingsController = class RatingsController {
    ratingsService;
    constructor(ratingsService) {
        this.ratingsService = ratingsService;
    }
    listStores(request, query) {
        return this.ratingsService.listStores(request.user.id, query);
    }
    async create(request, dto) {
        return {
            data: await this.ratingsService.create(request.user.id, dto),
        };
    }
    async update(request, ratingId, dto) {
        return {
            data: await this.ratingsService.update(request.user.id, ratingId, dto),
        };
    }
};
exports.RatingsController = RatingsController;
__decorate([
    (0, common_1.Get)('stores'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, list_rated_stores_dto_1.ListRatedStoresDto]),
    __metadata("design:returntype", void 0)
], RatingsController.prototype, "listStores", null);
__decorate([
    (0, common_1.Post)('ratings'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, rating_dto_1.CreateRatingDto]),
    __metadata("design:returntype", Promise)
], RatingsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)('ratings/:ratingId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('ratingId', new common_1.ParseUUIDPipe())),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, rating_dto_1.UpdateRatingDto]),
    __metadata("design:returntype", Promise)
], RatingsController.prototype, "update", null);
exports.RatingsController = RatingsController = __decorate([
    (0, common_1.Controller)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.NORMAL_USER),
    __metadata("design:paramtypes", [ratings_service_1.RatingsService])
], RatingsController);
//# sourceMappingURL=ratings.controller.js.map