"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcrypt"));
const user_entity_1 = require("../entities/user.entity");
const auth_tokens_1 = require("./auth.tokens");
const BCRYPT_ROUNDS = 12;
let AuthService = class AuthService {
    usersRepository;
    jwtService;
    constructor(usersRepository, jwtService) {
        this.usersRepository = usersRepository;
        this.jwtService = jwtService;
    }
    async register(dto) {
        const email = dto.email.trim().toLowerCase();
        const existingUser = await this.usersRepository.findOneBy({ email });
        if (existingUser) {
            throw new common_1.ConflictException('Email is already registered');
        }
        const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
        const user = this.usersRepository.create({
            name: dto.name.trim(),
            email,
            address: dto.address.trim(),
            passwordHash,
            role: user_entity_1.UserRole.NORMAL_USER,
        });
        try {
            const createdUser = await this.usersRepository.save(user);
            return this.createAuthResponse(createdUser);
        }
        catch (error) {
            if (this.isUniqueConstraintViolation(error)) {
                throw new common_1.ConflictException('Email is already registered');
            }
            throw error;
        }
    }
    async login(dto) {
        const user = await this.usersRepository.findOneBy({
            email: dto.email.trim().toLowerCase(),
        });
        if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        return this.createAuthResponse(user);
    }
    async changePassword(userId, dto) {
        const user = await this.usersRepository.findOneBy({ id: userId });
        if (!user) {
            throw new common_1.UnauthorizedException('Authenticated user no longer exists');
        }
        if (!(await bcrypt.compare(dto.currentPassword, user.passwordHash))) {
            throw new common_1.UnauthorizedException('Current password is incorrect');
        }
        if (await bcrypt.compare(dto.newPassword, user.passwordHash)) {
            throw new common_1.BadRequestException('New password must differ from the current password');
        }
        user.passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
        await this.usersRepository.save(user);
        return { message: 'Password updated successfully' };
    }
    async createAuthResponse(user) {
        const payload = {
            sub: user.id,
            role: user.role,
        };
        const accessToken = await this.jwtService.signAsync(payload);
        const publicUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            address: user.address,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
        return { accessToken, user: publicUser };
    }
    isUniqueConstraintViolation(error) {
        if (typeof error !== 'object' ||
            error === null ||
            !('driverError' in error) ||
            typeof error.driverError !== 'object' ||
            error.driverError === null ||
            !('code' in error.driverError)) {
            return false;
        }
        return error.driverError.code === '23505';
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(auth_tokens_1.AUTH_USER_REPOSITORY)),
    __param(1, (0, common_1.Inject)(auth_tokens_1.JWT_TOKEN_SIGNER)),
    __metadata("design:paramtypes", [Object, Object])
], AuthService);
//# sourceMappingURL=auth.service.js.map