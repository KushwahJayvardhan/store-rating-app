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
exports.StoreOwnershipGuard = void 0;
const common_1 = require("@nestjs/common");
const auth_tokens_1 = require("./auth.tokens");
let StoreOwnershipGuard = class StoreOwnershipGuard {
    storesRepository;
    constructor(storesRepository) {
        this.storesRepository = storesRepository;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const storeId = request.params.storeId;
        if (!storeId || !request.user) {
            throw new common_1.NotFoundException('Store not found');
        }
        const store = await this.storesRepository.findOneBy({
            id: storeId,
            ownerId: request.user.id,
        });
        if (!store) {
            throw new common_1.NotFoundException('Store not found');
        }
        return true;
    }
};
exports.StoreOwnershipGuard = StoreOwnershipGuard;
exports.StoreOwnershipGuard = StoreOwnershipGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(auth_tokens_1.STORE_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], StoreOwnershipGuard);
//# sourceMappingURL=store-ownership.guard.js.map