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
exports.StoreOwnerDashboardService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const rating_entity_1 = require("../entities/rating.entity");
const store_entity_1 = require("../entities/store.entity");
const RATING_SORT_COLUMNS = {
    name: 'user.name',
    email: 'user.email',
    rating: 'rating.value',
    createdAt: 'rating.createdAt',
};
let StoreOwnerDashboardService = class StoreOwnerDashboardService {
    storesRepository;
    ratingsRepository;
    constructor(storesRepository, ratingsRepository) {
        this.storesRepository = storesRepository;
        this.ratingsRepository = ratingsRepository;
    }
    async getDashboard(ownerId, query) {
        const store = await this.storesRepository.findOneBy({ ownerId });
        if (!store) {
            throw new common_1.NotFoundException('Store not found');
        }
        const [aggregate, [ratings, total]] = await Promise.all([
            this.ratingsRepository
                .createQueryBuilder('rating')
                .select('AVG(rating.value)', 'averageRating')
                .where('rating.storeId = :storeId', { storeId: store.id })
                .getRawOne(),
            this.createRatersQuery(store.id)
                .orderBy(RATING_SORT_COLUMNS[query.sortBy], query.sortOrder)
                .addOrderBy('rating.id', 'ASC')
                .skip((query.page - 1) * query.limit)
                .take(query.limit)
                .getManyAndCount(),
        ]);
        return {
            averageRating: aggregate?.averageRating === null ||
                aggregate?.averageRating === undefined
                ? null
                : Number(aggregate.averageRating),
            ratings: ratings.map((rating) => ({
                name: rating.user.name,
                email: rating.user.email,
                address: rating.user.address,
                rating: rating.value,
                submittedAt: rating.createdAt,
            })),
            meta: {
                page: query.page,
                limit: query.limit,
                total,
                totalPages: Math.ceil(total / query.limit),
            },
        };
    }
    createRatersQuery(storeId) {
        return this.ratingsRepository
            .createQueryBuilder('rating')
            .select([
            'rating.id',
            'rating.value',
            'rating.createdAt',
            'user.id',
            'user.name',
            'user.email',
            'user.address',
        ])
            .innerJoin('rating.user', 'user')
            .where('rating.storeId = :storeId', { storeId });
    }
};
exports.StoreOwnerDashboardService = StoreOwnerDashboardService;
exports.StoreOwnerDashboardService = StoreOwnerDashboardService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(store_entity_1.Store)),
    __param(1, (0, typeorm_1.InjectRepository)(rating_entity_1.Rating)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], StoreOwnerDashboardService);
//# sourceMappingURL=store-owner-dashboard.service.js.map