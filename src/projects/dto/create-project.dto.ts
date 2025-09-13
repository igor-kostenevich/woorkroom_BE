// src/projects/dto/create-project.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { ProjectPriority } from '@prisma/client';

export class CreateProjectDto {
  @ApiProperty({ example: 'Medical App (iOS native)' })
  @IsString()
  @Length(1, 200)
  name!: string;

  @ApiPropertyOptional({ example: 'App for maintaining medical records...' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ enum: ProjectPriority, enumName: 'ProjectPriority', default: ProjectPriority.MEDIUM })
  @IsOptional()
  @IsEnum(ProjectPriority)
  priority?: ProjectPriority;

  @ApiPropertyOptional({ example: '2025-09-10T00:00:00.000Z', description: 'Start date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Project avatar (preset)',
    example: 'preset-01'
  })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ example: '2026-02-01T00:00:00.000Z', description: 'Deadline (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  deadline?: string;
}
