import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { Role } from '@prisma/client';
import { PublicFileRefDto } from '../../../storage/common/public-file-ref.dto';

export class EmployeeResponse {
  @ApiProperty({ example: 'f7c5b2f3-8a4b-4b9c-9f1a-1a2b3c4d5e6f' })
  id!: string;

  @ApiProperty({ example: 'john.doe@company.com' })
  email!: string;

  @ApiProperty({ example: 'John' })
  firstName!: string;

  @ApiPropertyOptional({ example: 'Doe', nullable: true })
  lastName!: string | null;

  @ApiProperty({ description: 'Full name', readOnly: true })
  @Expose()
  get fullName(): string {
    return `${this.firstName} ${this.lastName ?? ''}`.trim();
  }

  @ApiProperty({ enum: Role, example: Role.USER })
  role!: Role;

  @ApiPropertyOptional({ example: 'Frontend Developer', nullable: true })
  position?: string | null;

  @ApiPropertyOptional({ example: 'Kyiv', nullable: true })
  location?: string | null;

  @ApiPropertyOptional({ example: '+380501234567', nullable: true })
  phone?: string | null;

  @ApiPropertyOptional({ type: () => PublicFileRefDto, nullable: true })
  avatar?: PublicFileRefDto | null;

  @ApiProperty({ type: Date })
  createdAt!: Date;

  @ApiPropertyOptional({ description: 'Number of projects the employee is assigned to', default: 0 })
  projectsCount?: number;
}
