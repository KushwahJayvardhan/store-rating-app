"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const jwt_2 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const user_entity_1 = require("../entities/user.entity");
const store_entity_1 = require("../entities/store.entity");
const authorization_demo_controller_1 = require("./authorization-demo.controller");
const auth_controller_1 = require("./auth.controller");
const auth_service_1 = require("./auth.service");
const auth_tokens_1 = require("./auth.tokens");
const jwt_auth_guard_1 = require("./jwt-auth.guard");
const jwt_strategy_1 = require("./jwt.strategy");
const roles_guard_1 = require("./roles.guard");
const store_ownership_guard_1 = require("./store-ownership.guard");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([user_entity_1.User, store_entity_1.Store]),
            passport_1.PassportModule.register({ defaultStrategy: 'jwt' }),
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    secret: configService.getOrThrow('JWT_SECRET'),
                    signOptions: {
                        expiresIn: Number(configService.get('JWT_EXPIRES_IN_SECONDS', 3600)),
                    },
                }),
            }),
        ],
        controllers: [auth_controller_1.AuthController, authorization_demo_controller_1.AuthorizationDemoController],
        providers: [
            auth_service_1.AuthService,
            jwt_strategy_1.JwtStrategy,
            jwt_auth_guard_1.JwtAuthGuard,
            roles_guard_1.RolesGuard,
            store_ownership_guard_1.StoreOwnershipGuard,
            { provide: auth_tokens_1.JWT_TOKEN_SIGNER, useExisting: jwt_2.JwtService },
            {
                provide: auth_tokens_1.AUTH_USER_REPOSITORY,
                useExisting: (0, typeorm_1.getRepositoryToken)(user_entity_1.User),
            },
            {
                provide: auth_tokens_1.STORE_REPOSITORY,
                useExisting: (0, typeorm_1.getRepositoryToken)(store_entity_1.Store),
            },
        ],
        exports: [auth_service_1.AuthService, jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, store_ownership_guard_1.StoreOwnershipGuard],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map