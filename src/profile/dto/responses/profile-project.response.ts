import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectPriority } from '@prisma/client';
import { AvatarDto } from '../../../storage/common/public-file-ref.dto';
import { ProjectMemberDto } from '../../../projects/dto/response/project-member.dto';

export class ProfileProjectResponse {
  @ApiProperty({ example: 'f7c5b2f3-8a4b-4b9c-9f1a-1a2b3c4d5e6f' })
  id: string;

  @ApiProperty({ example: 'PN000123' })
  code: string;

  @ApiProperty({ example: 'Medical App (iOS native)' })
  name: string;

  @ApiPropertyOptional({ type: () => AvatarDto, nullable: true, description: 'Project avatar' })
  avatar?: AvatarDto | null;

  @ApiProperty({ enum: ProjectPriority, enumName: 'Project Priority', example: ProjectPriority.MEDIUM })
  priority: ProjectPriority | null;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ example: 0, description: 'Total number of tasks in the project' })
  allTasksCount: number;

  @ApiProperty({ example: 0, description: 'Number of active tasks (in progress, todo, or testing)' })
  activeTasksCount: number;

  @ApiProperty({ type: () => [ProjectMemberDto], description: 'Project assignees' })
  assignees: ProjectMemberDto[];
}

