export declare const STORE_RATING_SORT_FIELDS: readonly ["name", "email", "rating", "createdAt"];
export type StoreRatingSortField = (typeof STORE_RATING_SORT_FIELDS)[number];
export declare class ListStoreRatingsDto {
    page: number;
    limit: number;
    sortBy: StoreRatingSortField;
    sortOrder: 'ASC' | 'DESC';
}
