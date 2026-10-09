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
exports.Rating = void 0;
const typeorm_1 = require("typeorm");
const store_entity_1 = require("./store.entity");
const user_entity_1 = require("./user.entity");
let Rating = class Rating {
    id;
    value;
    userId;
    storeId;
    createdAt;
    updatedAt;
    user;
    store;
};
exports.Rating = Rating;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Rating.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'smallint', nullable: false }),
    __metadata("design:type", Number)
], Rating.prototype, "value", void 0);
__decorate([
    (0, typeorm_1.Index)('IDX_RATINGS_USER_ID'),
    (0, typeorm_1.Column)({ name: 'user_id', type: 'uuid', nullable: false }),
    __metadata("design:type", String)
], Rating.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Index)('IDX_RATINGS_STORE_ID'),
    (0, typeorm_1.Column)({ name: 'store_id', type: 'uuid', nullable: false }),
    __metadata("design:type", String)
], Rating.prototype, "storeId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz', precision: 3 }),
    __metadata("design:type", Date)
], Rating.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamptz', precision: 3 }),
    __metadata("design:type", Date)
], Rating.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.ratings, { nullable: false, onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], Rating.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => store_entity_1.Store, (store) => store.ratings, { nullable: false, onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'store_id' }),
    __metadata("design:type", store_entity_1.Store)
], Rating.prototype, "store", void 0);
exports.Rating = Rating = __decorate([
    (0, typeorm_1.Entity)({ name: 'ratings' }),
    (0, typeorm_1.Unique)('UQ_RATINGS_USER_STORE', ['userId', 'storeId']),
    (0, typeorm_1.Check)('CHK_RATING_VALUE', '"value" BETWEEN 1 AND 5')
], Rating);
//# sourceMappingURL=rating.entity.js.map