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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const bcrypt = __importStar(require("bcrypt"));
const typeorm_2 = require("typeorm");
const rating_entity_1 = require("../entities/rating.entity");
const user_entity_1 = require("../entities/user.entity");
const BCRYPT_ROUNDS = 12;
const USER_SORT_COLUMNS = {
    name: 'user.name',
    email: 'user.email',
    address: 'user.address',
    role: 'user.role',
    createdAt: 'user.createdAt',
};
let UsersService = class UsersService {
    usersRepository;
    ratingsRepository;
    constructor(usersRepository, ratingsRepository) {
        this.usersRepository = usersRepository;
        this.ratingsRepository = ratingsRepository;
    }
    async create(dto) {
        const email = dto.email.trim().toLowerCase();
        const existingUser = await this.usersRepository.findOneBy({ email });
        if (existingUser) {
            throw new common_1.ConflictException('Email is already registered');
        }
        const user = this.usersRepository.create({
            name: dto.name.trim(),
            email,
            address: dto.address.trim(),
            passwordHash: await bcrypt.hash(dto.password, BCRYPT_ROUNDS),
            role: dto.role,
        });
        try {
            return this.toListItem(await this.usersRepository.save(user));
        }
        catch (error) {
            if (this.isUniqueConstraintViolation(error)) {
                throw new common_1.ConflictException('Email is already registered');
            }
            throw error;
        }
    }
    async findAll(query) {
        const queryBuilder = this.usersRepository
            .createQueryBuilder('user')
            .select([
            'user.id',
            'user.name',
            'user.email',
            'user.address',
            'user.role',
        ]);
        this.applyFilters(queryBuilder, query);
        const [users, total] = await queryBuilder
            .orderBy(USER_SORT_COLUMNS[query.sortBy], query.sortOrder)
            .skip((query.page - 1) * query.limit)
            .take(query.limit)
            .getManyAndCount();
        return {
            data: users.map((user) => this.toListItem(user)),
            meta: {
                page: query.page,
                limit: query.limit,
                total,
                totalPages: Math.ceil(total / query.limit),
            },
        };
    }
    async findOne(id) {
        const user = await this.usersRepository
            .createQueryBuilder('user')
            .select([
            'user.id',
            'user.name',
            'user.email',
            'user.address',
            'user.role',
            'user.createdAt',
            'user.updatedAt',
        ])
            .leftJoinAndSelect('user.store', 'store')
            .addSelect(['store.id', 'store.name', 'store.email', 'store.address'])
            .where('user.id = :id', { id })
            .getOne();
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const details = {
            ...this.toListItem(user),
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
        if (user.role === user_entity_1.UserRole.STORE_OWNER) {
            const storeIds = user.store ? [user.store.id] : [];
            const ratings = storeIds.length
                ? await this.ratingsRepository
                    .createQueryBuilder('rating')
                    .select('rating.storeId', 'storeId')
                    .addSelect('AVG(rating.value)', 'averageRating')
                    .where('rating.storeId IN (:...storeIds)', { storeIds })
                    .groupBy('rating.storeId')
                    .getRawMany()
                : [];
            const ratingsByStore = new Map(ratings.map(({ storeId, averageRating }) => [
                storeId,
                Number(averageRating),
            ]));
            if (user.store) {
                details.stores = [
                    {
                        id: user.store.id,
                        name: user.store.name,
                        email: user.store.email,
                        address: user.store.address,
                        averageRating: ratingsByStore.get(user.store.id) ?? null,
                    },
                ];
            }
            else {
                details.stores = [];
            }
        }
        return details;
    }
    applyFilters(queryBuilder, query) {
        if (query.name) {
            queryBuilder.andWhere('user.name ILIKE :name', {
                name: `%${this.escapeLike(query.name)}%`,
            });
        }
        if (query.email) {
            queryBuilder.andWhere('user.email ILIKE :email', {
                email: `%${this.escapeLike(query.email)}%`,
            });
        }
        if (query.address) {
            queryBuilder.andWhere('user.address ILIKE :address', {
                address: `%${this.escapeLike(query.address)}%`,
            });
        }
        if (query.role) {
            queryBuilder.andWhere('user.role = :role', { role: query.role });
        }
    }
    escapeLike(value) {
        return value.replace(/[\\%_]/g, '\\$&');
    }
    toListItem(user) {
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            address: user.address,
            role: user.role,
        };
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
        return (error.driverError.code === '23505' ||
            error.driverError.code === '1062' ||
            error.driverError.code === 'ER_DUP_ENTRY');
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(rating_entity_1.Rating)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map