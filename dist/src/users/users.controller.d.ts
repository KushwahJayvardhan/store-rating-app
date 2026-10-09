import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { ListUsersDto } from './dto/list-users.dto';
import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(dto: CreateAdminUserDto): Promise<{
        data: import("./users.service").UserListItem;
    }>;
    findAll(query: ListUsersDto): Promise<import("./users.service").PaginatedUsers>;
    findOne(id: string): Promise<{
        data: import("./users.service").UserDetails;
    }>;
}
