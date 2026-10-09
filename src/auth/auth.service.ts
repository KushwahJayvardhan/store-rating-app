import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../entities/user.entity';
import type { User } from '../entities/user.entity';
import type {
  AuthResponse,
  JwtPayload,
  JwtTokenSigner,
  PublicUser,
  UserRepository,
} from './auth.types';
import { AUTH_USER_REPOSITORY, JWT_TOKEN_SIGNER } from './auth.tokens';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    @Inject(AUTH_USER_REPOSITORY)
    private readonly usersRepository: UserRepository,
    @Inject(JWT_TOKEN_SIGNER)
    private readonly jwtService: JwtTokenSigner,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const email = dto.email.trim().toLowerCase();
    const existingUser = await this.usersRepository.findOneBy({ email });
    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = this.usersRepository.create({
      name: dto.name.trim(),
      email,
      address: dto.address.trim(),
      passwordHash,
      role: UserRole.NORMAL_USER,
    });

    try {
      const createdUser = await this.usersRepository.save(user);
      return this.createAuthResponse(createdUser);
    } catch (error: unknown) {
      if (this.isUniqueConstraintViolation(error)) {
        throw new ConflictException('Email is already registered');
      }
      throw error;
    }
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersRepository.findOneBy({
      email: dto.email.trim().toLowerCase(),
    });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.createAuthResponse(user);
  }

  private async createAuthResponse(user: User): Promise<AuthResponse> {
    const payload: JwtPayload = {
      sub: user.id,
      role: user.role,
    };
    const accessToken = await this.jwtService.signAsync(payload);

    const publicUser: PublicUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      address: user.address,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return { accessToken, user: publicUser };
  }

  private isUniqueConstraintViolation(error: unknown): boolean {
    if (
      typeof error !== 'object' ||
      error === null ||
      !('driverError' in error) ||
      typeof error.driverError !== 'object' ||
      error.driverError === null ||
      !('code' in error.driverError)
    ) {
      return false;
    }

    return error.driverError.code === '23505';
  }
}
