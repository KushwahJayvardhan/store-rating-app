import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserRole } from '../../entities/user.entity';

export class CreateAdminUserDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(20)
  @MaxLength(60)
  name: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(255)
  email: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(400)
  address: string;

  @IsString()
  @Matches(/^(?=.*[A-Z])(?=.*[^A-Za-z0-9\s]).{8,16}$/, {
    message:
      'password must be 8-16 characters and contain an uppercase letter and a special character',
  })
  password: string;

  @IsIn([UserRole.NORMAL_USER, UserRole.SYSTEM_ADMIN])
  role: UserRole.NORMAL_USER | UserRole.SYSTEM_ADMIN;
}
