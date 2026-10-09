import type { Request } from 'express';
import { AuthService } from './auth.service';
import type { AuthenticatedUser, AuthResponse } from './auth.types';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
type AuthenticatedRequest = Request & {
    user: AuthenticatedUser;
};
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<AuthResponse>;
    login(dto: LoginDto): Promise<AuthResponse>;
    getProfile(request: AuthenticatedRequest): AuthenticatedUser;
}
export {};
