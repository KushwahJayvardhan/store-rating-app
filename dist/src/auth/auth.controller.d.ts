import type { Request } from 'express';
import { AuthService } from './auth.service';
import type { AuthenticatedUser, AuthResponse } from './auth.types';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
type AuthenticatedRequest = Request & {
    user: AuthenticatedUser;
};
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<AuthResponse>;
    login(dto: LoginDto): Promise<AuthResponse>;
    changePassword(request: AuthenticatedRequest, dto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    getProfile(request: AuthenticatedRequest): AuthenticatedUser;
}
export {};
