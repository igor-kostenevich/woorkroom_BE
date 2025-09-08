
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginRequest {
  @ApiProperty({
    description: 'User email',
    example: "johndoe@gmail.com",
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: "123456",
    minLength: 6,
    maxLength: 128
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password is too short. Minimum length is 6 characters' })
  @MaxLength(128, { message: 'Password is too long. Maximum length is 128 characters' })
  password: string;
}