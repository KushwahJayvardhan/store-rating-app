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
exports.StoresService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const rating_entity_1 = require("../entities/rating.entity");
const store_entity_1 = require("../entities/store.entity");
const user_entity_1 = require("../entities/user.entity");
const STORE_SORT_COLUMNS = {
    name: 'store.name',
    email: 'store.email',
    address: 'store.address',
    rating: '(SELECT AVG(rating.value) FROM ratings rating WHERE rating.store_id = store.id)',
    createdAt: 'store.createdAt',
};
let StoresService = class StoresService {
    storesRepository;
    usersRepository;
    ratingsRepository;
    constructor(storesRepository, usersRepository, ratingsRepository) {
        this.storesRepository = storesRepository;
        this.usersRepository = usersRepository;
        this.ratingsRepository = ratingsRepository;
    }
    async create(dto) {
        const email = dto.email.trim().toLowerCase();
        const [existingEmail, owner] = await Promise.all([
            this.storesRepository.findOneBy({ email }),
            this.usersRepository.findOneBy({ id: dto.ownerId }),
        ]);
        if (existingEmail) {
            throw new common_1.ConflictException('Store email is already registered');
        }
        if (!owner || owner.role !== user_entity_1.UserRole.STORE_OWNER) {
            throw new common_1.NotFoundException('Store owner not found');
        }
        const existingStore = await this.storesRepository.findOneBy({
            ownerId: owner.id,
        });
        if (existingStore) {
            throw new common_1.ConflictException('Store owner already has a store');
        }
        const store = this.storesRepository.create({
            name: dto.name.trim(),
            email,
            address: dto.address.trim(),
            ownerId: owner.id,
        });
        try {
            const createdStore = await this.storesRepository.save(store);
            return this.toResponse(createdStore, owner, null);
        }
        catch (error) {
            if (this.isUniqueConstraintViolation(error)) {
                throw new common_1.ConflictException('Store email or owner is already registered');
            }
            throw error;
        }
    }
    async findAll(query) {
        const queryBuilder = this.createStoreQuery();
        this.applyFilters(queryBuilder, query);
        const [stores, total] = await queryBuilder
            .orderBy(STORE_SORT_COLUMNS[query.sortBy], query.sortOrder)
            .skip((query.page - 1) * query.limit)
            .take(query.limit)
            .getManyAndCount();
        const ratingsByStore = await this.getAverageRatings(stores.map((store) => store.id));
        return {
            data: stores.map((store) => this.toResponse(store, store.owner, ratingsByStore.get(store.id) ?? null)),
            meta: {
                page: query.page,
                limit: query.limit,
                total,
                totalPages: Math.ceil(total / query.limit),
            },
        };
    }
    async findOne(id) {
        const store = await this.createStoreQuery()
            .where('store.id = :id', { id })
            .getOne();
        if (!store) {
            throw new common_1.NotFoundException('Store not found');
        }
        const ratingsByStore = await this.getAverageRatings([store.id]);
        return this.toResponse(store, store.owner, ratingsByStore.get(store.id) ?? null);
    }
    createStoreQuery() {
        return this.storesRepository
            .createQueryBuilder('store')
            .select([
            'store.id',
            'store.name',
            'store.email',
            'store.address',
            'store.ownerId',
            'store.createdAt',
        ])
            .leftJoin('store.owner', 'owner')
            .addSelect(['owner.id', 'owner.name', 'owner.email']);
    }
    applyFilters(queryBuilder, query) {
        if (query.name) {
            queryBuilder.andWhere('store.name ILIKE :name', {
                name: `%${this.escapeLike(query.name)}%`,
            });
        }
        if (query.email) {
            queryBuilder.andWhere('store.email ILIKE :email', {
                email: `%${this.escapeLike(query.email)}%`,
            });
        }
        if (query.address) {
            queryBuilder.andWhere('store.address ILIKE :address', {
                address: `%${this.escapeLike(query.address)}%`,
            });
        }
    }
    async getAverageRatings(storeIds) {
        if (storeIds.length === 0) {
            return new Map();
        }
        const averages = await this.ratingsRepository
            .createQueryBuilder('rating')
            .select('rating.storeId', 'storeId')
            .addSelect('AVG(rating.value)', 'averageRating')
            .where('rating.storeId IN (:...storeIds)', { storeIds })
            .groupBy('rating.storeId')
            .getRawMany();
        return new Map(averages.map(({ storeId, averageRating }) => [
            storeId,
            Number(averageRating),
        ]));
    }
    escapeLike(value) {
        return value.replace(/[\\%_]/g, '\\$&');
    }
    toResponse(store, owner, averageRating) {
        return {
            id: store.id,
            name: store.name,
            email: store.email,
            address: store.address,
            owner: {
                id: owner.id,
                name: owner.name,
                email: owner.email,
            },
            averageRating,
            createdAt: store.createdAt,
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
exports.StoresService = StoresService;
exports.StoresService = StoresService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(store_entity_1.Store)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_1.InjectRepository)(rating_entity_1.Rating)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], StoresService);
//# sourceMappingURL=stores.service.js.map