import { ApiProperty } from '@nestjs/swagger';
import { ProjectRole } from '@prisma/client';
import { ProjectUserBriefDto } from './project-user-brief.dto';

export class ProjectMemberDto {
  @ApiProperty({ enum: ProjectRole }) role!: ProjectRole;
  @ApiProperty({ type: () => ProjectUserBriefDto }) user!: ProjectUserBriefDto;
}
