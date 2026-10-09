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
exports.RatingsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const rating_entity_1 = require("../entities/rating.entity");
const store_entity_1 = require("../entities/store.entity");
let RatingsService = class RatingsService {
    ratingsRepository;
    storesRepository;
    constructor(ratingsRepository, storesRepository) {
        this.ratingsRepository = ratingsRepository;
        this.storesRepository = storesRepository;
    }
    async create(userId, dto) {
        const store = await this.storesRepository.findOneBy({ id: dto.storeId });
        if (!store) {
            throw new common_1.NotFoundException('Store not found');
        }
        const existingRating = await this.ratingsRepository.findOneBy({
            userId,
            storeId: dto.storeId,
        });
        if (existingRating) {
            throw new common_1.ConflictException('You have already rated this store');
        }
        const rating = this.ratingsRepository.create({
            userId,
            storeId: dto.storeId,
            value: dto.value,
        });
        try {
            return this.toResponse(await this.ratingsRepository.save(rating));
        }
        catch (error) {
            if (this.isUniqueConstraintViolation(error)) {
                throw new common_1.ConflictException('You have already rated this store');
            }
            throw error;
        }
    }
    async update(userId, ratingId, dto) {
        const rating = await this.ratingsRepository.findOneBy({
            id: ratingId,
            userId,
        });
        if (!rating) {
            throw new common_1.NotFoundException('Rating not found');
        }
        rating.value = dto.value;
        return this.toResponse(await this.ratingsRepository.save(rating));
    }
    async listStores(userId, query) {
        const queryBuilder = this.storesRepository
            .createQueryBuilder('store')
            .select(['store.id', 'store.name', 'store.address']);
        if (query.name) {
            queryBuilder.andWhere('store.name ILIKE :name', {
                name: `%${this.escapeLike(query.name)}%`,
            });
        }
        if (query.address) {
            queryBuilder.andWhere('store.address ILIKE :address', {
                address: `%${this.escapeLike(query.address)}%`,
            });
        }
        const [stores, total] = await queryBuilder
            .orderBy('store.name', 'ASC')
            .skip((query.page - 1) * query.limit)
            .take(query.limit)
            .getManyAndCount();
        const ratings = await this.findRatingAggregates(stores.map((store) => store.id), userId);
        const aggregatesByStore = new Map(ratings.map((rating) => [
            rating.storeId,
            {
                averageRating: rating.averageRating
                    ? Number(rating.averageRating)
                    : null,
                userRating: rating.userRating === null ? null : Number(rating.userRating),
            },
        ]));
        return {
            data: stores.map((store) => {
                const aggregate = aggregatesByStore.get(store.id);
                return {
                    id: store.id,
                    name: store.name,
                    address: store.address,
                    averageRating: aggregate?.averageRating ?? null,
                    userRating: aggregate?.userRating ?? null,
                    hasRated: aggregate?.userRating !== null && aggregate !== undefined,
                };
            }),
            meta: {
                page: query.page,
                limit: query.limit,
                total,
                totalPages: Math.ceil(total / query.limit),
            },
        };
    }
    findRatingAggregates(storeIds, userId) {
        if (storeIds.length === 0) {
            return Promise.resolve([]);
        }
        return this.ratingsRepository
            .createQueryBuilder('rating')
            .select('rating.storeId', 'storeId')
            .addSelect('AVG(rating.value)', 'averageRating')
            .addSelect('MAX(CASE WHEN rating.userId = :userId THEN rating.value END)', 'userRating')
            .where('rating.storeId IN (:...storeIds)', { storeIds })
            .setParameter('userId', userId)
            .groupBy('rating.storeId')
            .getRawMany();
    }
    escapeLike(value) {
        return value.replace(/[\\%_]/g, '\\$&');
    }
    toResponse(rating) {
        return {
            id: rating.id,
            storeId: rating.storeId,
            value: rating.value,
            createdAt: rating.createdAt,
            updatedAt: rating.updatedAt,
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
exports.RatingsService = RatingsService;
exports.RatingsService = RatingsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(rating_entity_1.Rating)),
    __param(1, (0, typeorm_1.InjectRepository)(store_entity_1.Store)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], RatingsService);
//# sourceMappingURL=ratings.service.js.map