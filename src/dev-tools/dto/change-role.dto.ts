import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { Role } from '@prisma/client';

export class ChangeRoleDto {
  @ApiProperty({
    description: 'Нова роль користувача',
    enum: Role,
    example: Role.MANAGER,
  })
  @IsEnum(Role)
  role!: Role;
}

