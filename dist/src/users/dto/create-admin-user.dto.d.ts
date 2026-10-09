import { UserRole } from '../../entities/user.entity';
export declare class CreateAdminUserDto {
    name: string;
    email: string;
    address: string;
    password: string;
    role: UserRole.NORMAL_USER | UserRole.SYSTEM_ADMIN;
}
