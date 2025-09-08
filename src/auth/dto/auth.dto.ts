import { ApiProperty } from '@nestjs/swagger';
import { IsString } from "class-validator";

export class AuthResponse {
  @ApiProperty({
    description: 'Access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6I...',
  })
  @IsString()
  accessToken: string;
}