import { IsArray, IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'

class OnboardingDto {
  @ApiPropertyOptional() @IsOptional() @IsString() purpose?: string
  @ApiPropertyOptional() @IsOptional() @IsString() persona?: string
  @ApiPropertyOptional() @IsOptional() @IsBoolean() extraYesNo?: boolean
}

class CompanyDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(80) name?: string
  @ApiPropertyOptional() @IsOptional() @IsString() direction?: string
  @ApiPropertyOptional() @IsOptional() @IsString() teamSize?: string
}

export class RegisterRequest {
  @ApiProperty({ example: 'johndoe@gmail.com' }) @IsString() @IsNotEmpty() @IsEmail() email: string
  @ApiProperty({ example: 'secret123', minLength: 6 }) @IsString() @IsNotEmpty() @MinLength(6) @MaxLength(128) password: string
  @ApiProperty({ example: 'John' }) @IsNotEmpty() @MaxLength(50) @IsString() firstName: string

  @ApiPropertyOptional({ description: 'Verified phone token from /auth/phone/verify' })
  @IsOptional() @IsString() phoneToken?: string

  @ApiPropertyOptional({ type: OnboardingDto }) @IsOptional() @ValidateNested() @Type(() => OnboardingDto) onboarding?: OnboardingDto
  @ApiPropertyOptional({ type: CompanyDto })    @IsOptional() @ValidateNested() @Type(() => CompanyDto)   company?: CompanyDto
  @ApiPropertyOptional({ type: [String] })      @IsOptional() @IsArray() invites?: string[]
}
