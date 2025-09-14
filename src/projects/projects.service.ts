import { PrismaService } from './../prisma/prisma.service';
import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { User, $Enums, ProjectRole } from '@prisma/client';
import { ProjectResponse } from './dto/response/project.response';
import { StorageService } from 'src/storage/storage.service';

import { PROJECT_SELECT } from './selects';
import { mapProjectRowToResponse } from './mappers/project.mapper';
import { buildAvatarPayload } from './utils/avatar.util';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  private isAdmin(u: User) { return u.role === $Enums.Role.ADMIN; }

  private async nextProjectCode(): Promise<string> {
    const counter = await this.prisma.counter.upsert({
      where: { id: 'project' },
      update: { value: { increment: 1 } },
      create: { id: 'project', value: 1 },
      select: { value: true },
    });
    return 'PN' + String(counter.value).padStart(6, '0');
  }

  async create(
    user: User,
    dto: CreateProjectDto,
    files: { avatarFile?: Express.Multer.File },
  ): Promise<ProjectResponse> {
    const avatar = await buildAvatarPayload(this.storage, user.id, dto.avatar, files.avatarFile);

    const row = await this.prisma.project.create({
      data: {
        code: await this.nextProjectCode(),
        name: dto.name,
        description: dto.description,
        priority: dto.priority,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        deadline: dto.deadline ? new Date(dto.deadline) : null,
        ownerId: user.id,
        avatar,
        members: { create: { userId: user.id, role: ProjectRole.OWNER } },
      },
      select: PROJECT_SELECT,
    });

    return plainToInstance(
      ProjectResponse,
      mapProjectRowToResponse(row, user.id, ProjectRole.OWNER),
    );
  }

  async list(user: User): Promise<ProjectResponse[]> {
    const rows = await this.prisma.project.findMany({
      where: { members: { some: { userId: user.id } } },
      orderBy: { createdAt: 'desc' },
      select: PROJECT_SELECT,
    });

    const mapped = rows.map(r => mapProjectRowToResponse(r, user.id, ProjectRole.VIEWER));
    return plainToInstance(ProjectResponse, mapped);
  }

  async getOne(user: User, id: string): Promise<ProjectResponse> {
    const row = await this.prisma.project.findUnique({
      where: { id },
      select: PROJECT_SELECT,
    });
    if (!row) throw new NotFoundException('Project not found');

    const resp = mapProjectRowToResponse(row, user.id, ProjectRole.VIEWER);
    if (!this.isAdmin(user) && !resp.myRole) {
      throw new ForbiddenException('No access to this project');
    }
    
    return plainToInstance(ProjectResponse, resp);
  }

  async update(user: User, id: string, dto: UpdateProjectDto): Promise<ProjectResponse> {
    const membership = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: id, userId: user.id } },
      select: { role: true },
    });
    if (!this.isAdmin(user) && membership?.role !== ProjectRole.OWNER) {
      throw new ForbiddenException('Only owner can update project');
    }

    const dataPatch: any = {
      name: dto.name ?? undefined,
      description: dto.description ?? undefined,
      priority: (dto.priority as any) ?? undefined,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      deadline: dto.deadline ? new Date(dto.deadline) : undefined,
    };
    if (dto.avatar) dataPatch.avatar = { name: dto.avatar.trim() };

    const row = await this.prisma.project.update({
      where: { id },
      data: dataPatch,
      select: PROJECT_SELECT,
    });

    return plainToInstance(
      ProjectResponse,
      mapProjectRowToResponse(row, user.id, ProjectRole.OWNER),
    );
  }
}
