import type { AuthResponse, JwtTokenSigner, UserRepository } from './auth.types';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
export declare class AuthService {
    private readonly usersRepository;
    private readonly jwtService;
    constructor(usersRepository: UserRepository, jwtService: JwtTokenSigner);
    register(dto: RegisterDto): Promise<AuthResponse>;
    login(dto: LoginDto): Promise<AuthResponse>;
    private createAuthResponse;
    private isUniqueConstraintViolation;
}
