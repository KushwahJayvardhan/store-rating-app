import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @IsString()
  @Matches(/^(?=.*[A-Z])(?=.*[^A-Za-z0-9\s]).{8,16}$/, {
    message:
      'newPassword must be 8-16 characters and contain an uppercase letter and a special character',
  })
  newPassword: string;
}
