import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { PublicFileRef } from 'src/storage/common/file-ref';
import { Role } from '@prisma/client'

export class UserProfileResponse {
  @ApiProperty({ description: 'User ID (UUID)', example: '...' })
  id: string;

  @ApiProperty({ description: 'User email', example: 'johndoe@gmail.com' })
  email: string;

  @ApiProperty({ description: 'User name', example: 'John' })
  firstName: string;

  @ApiProperty({ description: 'User last name', example: 'Doe', nullable: true })
  lastName: string | null;

  @ApiProperty({ description: 'Phone number', example: '+1234567890', nullable: true })
  phone: string | null;

  @ApiProperty({ description: 'Address', example: '...', nullable: true })
  address: string | null;

  @ApiProperty({ description: 'Role', example: 'user', enum: Role})
  role: Role;

  @ApiProperty({ description: 'User full name', example: 'John Doe', readOnly: true })
  @Expose()
  get fullName(): string {
    return `${this.firstName} ${this.lastName ?? ''}`.trim()
  }

  @ApiProperty({ description: 'User avatar', type: () => Object, nullable: true })
  avatar?: PublicFileRef | null;

  @ApiProperty({ description: 'Created at', example: '2025-04-29T14:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at', example: '2025-04-29T14:30:00.000Z' })
  updatedAt: Date;
}
