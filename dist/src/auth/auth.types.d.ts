import type { User, UserRole } from '../entities/user.entity';
export interface AuthenticatedUser {
    id: string;
    role: UserRole;
}
export interface JwtPayload {
    sub: string;
    role: UserRole;
}
export interface JwtTokenSigner {
    signAsync(payload: JwtPayload): Promise<string>;
}
export interface UserRepository {
    findOneBy(criteria: Partial<Pick<User, 'email'>>): Promise<User | null>;
    create(user: Partial<User>): User;
    save(user: User): Promise<User>;
}
export interface PublicUser {
    id: string;
    name: string;
    email: string;
    address: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
}
export interface AuthResponse {
    accessToken: string;
    user: PublicUser;
}
