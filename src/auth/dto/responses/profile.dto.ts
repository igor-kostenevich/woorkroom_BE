import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UserProfileResponse {
  @ApiProperty({ description: 'User ID (UUID)', example: '...' })
  id: string;

  @ApiProperty({ description: 'User email', example: 'johndoe@gmail.com' })
  email: string;

  @ApiProperty({ description: 'User name', example: 'John' })
  firstName: string;

  @ApiProperty({ description: 'User last name', example: 'Doe' })
  lastName: string;

  @ApiProperty({ description: 'Phone number', example: '+1234567890', nullable: true })
  phone: string | null;

  @ApiProperty({ description: 'Address', example: '...' })
  address: string;

  @ApiProperty({ description: 'Role', example: 'user', enum: ['user', 'admin'] })
  role: 'user' | 'admin';

  @ApiProperty({ description: 'User full name', example: 'John Doe' })
  @Expose()
  get fullName(): string {
    return `${this.firstName} ${this.lastName ?? ''}`.trim()
  }

  @ApiProperty({ description: 'Created at', example: '2025-04-29T14:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at', example: '2025-04-29T14:30:00.000Z' })
  updatedAt: Date;
}
