import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class RequestOtpDto {
  @ApiProperty({ example: '+380631234567' })
  @IsString()
  @MaxLength(20)
  phone: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: '+380631234567' })
  @IsString()
  @MaxLength(20)
  phone: string;

  @ApiProperty({ example: '1234' })
  @IsString()
  @MinLength(4)
  @MaxLength(4)
  code: string;
}
