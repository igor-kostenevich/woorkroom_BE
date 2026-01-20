import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateProfileRequest {
  @ApiPropertyOptional({description: 'New email', example: 'johndou@example.com'})
  @IsOptional() 
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(254)
  email?: string;

  @ApiPropertyOptional({ description: 'New name', example: 'John1' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Transform(({ value }) => (value === '' ? undefined : value))
  firstName?: string;

  @ApiPropertyOptional({ description: 'New last name', example: 'Doe1' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => (value === '' ? undefined : value))
  lastName?: string;

  @ApiPropertyOptional({ description: 'New phone number', example: '+1234567890' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @Transform(({ value }) => (value === '' ? undefined : value))
  phone?: string;

  @ApiPropertyOptional({ description: 'New address', example: '456 Updated St, NY' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => (value === '' ? undefined : value))
  address?: string;

  @ApiPropertyOptional({ description: 'Current password (required to change password)' })
  @IsOptional()
  @IsString()
  oldPassword?: string;

  @ApiPropertyOptional({ description: 'New password', minLength: 6 })
  @ValidateIf(o => o.oldPassword !== undefined)
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPassword?: string;

  @ApiPropertyOptional({ description: 'Repeat new password', minLength: 6 })
  @ValidateIf(o => o.oldPassword !== undefined)
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  repeatPassword?: string;

  hasAtLeastOneField() {
    return [
      this.email, this.firstName, this.lastName, this.address, this.phone,
      this.oldPassword, this.newPassword, this.repeatPassword,
    ].some(v => v !== undefined);
  }
}
