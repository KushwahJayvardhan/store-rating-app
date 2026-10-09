export declare const STORE_SORT_FIELDS: readonly ["name", "email", "address", "rating", "createdAt"];
export type StoreSortField = (typeof STORE_SORT_FIELDS)[number];
export declare class ListStoresDto {
    name?: string;
    email?: string;
    address?: string;
    page: number;
    limit: number;
    sortBy: StoreSortField;
    sortOrder: 'ASC' | 'DESC';
}
