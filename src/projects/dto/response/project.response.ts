import { ProjectMemberDto } from './project-member.dto';
import { ProjectUserBriefDto } from './project-user-brief.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectRole, ProjectPriority } from '@prisma/client';
import { AvatarDto } from '../../../storage/common/public-file-ref.dto';

export class ProjectResponse {
  @ApiProperty({ example: 'f7c5b2f3-8a4b-4b9c-9f1a-1a2b3c4d5e6f' })
  id!: string;

  @ApiProperty({ example: 'PN000123' })
  code!: string;

  @ApiProperty({ example: 'Medical App (iOS native)' })
  name!: string;

  @ApiPropertyOptional({ example: 'App for maintaining medical records...' })
  description?: string | null;

  @ApiProperty({ enum: ProjectPriority, enumName: 'Project Priority', example: ProjectPriority.MEDIUM })
  priority!: ProjectPriority;

  @ApiPropertyOptional({ type: Date, example: '2025-09-10T00:00:00.000Z', description: 'Start date (optional)' })
  startDate?: Date | null;

  @ApiPropertyOptional({ type: Date, example: '2026-02-01T00:00:00.000Z', description: 'Deadline (optional)' })
  deadline?: Date | null;

  @ApiPropertyOptional({ type: () => AvatarDto, nullable: true, description: 'Project avatar' })
  avatar?: AvatarDto | null

  @ApiProperty({ type: () => ProjectUserBriefDto })
  owner!: ProjectUserBriefDto;

  @ApiProperty({ type: () => [ProjectMemberDto] })
  members!: ProjectMemberDto[];

  @ApiProperty({ type: Date })
  createdAt!: Date;

  @ApiProperty({ type: Date })
  updatedAt!: Date;

  @ApiProperty({ enum: ProjectRole, enumName: 'ProjectMemberRole', example: ProjectRole.OWNER })
  myRole!: ProjectRole;
}
