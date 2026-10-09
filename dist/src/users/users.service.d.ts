import { Repository } from 'typeorm';
import { Rating } from '../entities/rating.entity';
import { User, UserRole } from '../entities/user.entity';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { ListUsersDto } from './dto/list-users.dto';
export interface UserListItem {
    id: string;
    name: string;
    email: string;
    address: string;
    role: UserRole;
}
export interface UserStoreDetails {
    id: string;
    name: string;
    email: string;
    address: string;
    averageRating: number | null;
}
export interface UserDetails extends UserListItem {
    createdAt: Date;
    updatedAt: Date;
    stores?: UserStoreDetails[];
}
export interface PaginatedUsers {
    data: UserListItem[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export declare class UsersService {
    private readonly usersRepository;
    private readonly ratingsRepository;
    constructor(usersRepository: Repository<User>, ratingsRepository: Repository<Rating>);
    create(dto: CreateAdminUserDto): Promise<UserListItem>;
    findAll(query: ListUsersDto): Promise<PaginatedUsers>;
    findOne(id: string): Promise<UserDetails>;
    private applyFilters;
    private escapeLike;
    private toListItem;
    private isUniqueConstraintViolation;
}
