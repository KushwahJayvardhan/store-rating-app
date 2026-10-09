import { UserRole } from '../../entities/user.entity';
export declare const USER_SORT_FIELDS: readonly ["name", "email", "address", "role", "createdAt"];
export type UserSortField = (typeof USER_SORT_FIELDS)[number];
export declare class ListUsersDto {
    name?: string;
    email?: string;
    address?: string;
    role?: UserRole;
    page: number;
    limit: number;
    sortBy: UserSortField;
    sortOrder: 'ASC' | 'DESC';
}
