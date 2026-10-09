"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoresModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const auth_module_1 = require("../auth/auth.module");
const rating_entity_1 = require("../entities/rating.entity");
const store_entity_1 = require("../entities/store.entity");
const user_entity_1 = require("../entities/user.entity");
const stores_controller_1 = require("./stores.controller");
const stores_service_1 = require("./stores.service");
let StoresModule = class StoresModule {
};
exports.StoresModule = StoresModule;
exports.StoresModule = StoresModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([store_entity_1.Store, user_entity_1.User, rating_entity_1.Rating]), auth_module_1.AuthModule],
        controllers: [stores_controller_1.StoresController],
        providers: [stores_service_1.StoresService],
    })
], StoresModule);
//# sourceMappingURL=stores.module.js.map