import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, MaxLength, IsArray, ValidateNested } from 'class-validator';
import { ProjectPriority, ProjectRole } from '@prisma/client';
import { Type } from 'class-transformer';

export class AssigneeDto {
  @ApiPropertyOptional({ example: 'f7c5b2f3-8a4b-4b9c-9f1a-1a2b3c4d5e6f' })
  @IsString()
  userId!: string;

  @ApiPropertyOptional({ enum: ProjectRole, enumName: 'ProjectRole', default: ProjectRole.MEMBER })
  @IsEnum(ProjectRole)
  role!: ProjectRole;
}

export class UpdateProjectDto {
  @ApiPropertyOptional({ example: 'Medical App (iOS native)' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ example: 'App for maintaining medical records...' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ enum: ProjectPriority, enumName: 'ProjectPriority' })
  @IsOptional()
  @IsEnum(ProjectPriority)
  priority?: ProjectPriority;

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

  @ApiPropertyOptional({ 
    type: () => [AssigneeDto],
    description: 'Project assignees (replaces all existing assignees)'
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssigneeDto)
  assignees?: AssigneeDto[];
}
