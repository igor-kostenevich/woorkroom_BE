import { PrismaService } from './../prisma/prisma.service';
import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { plainToInstance } from 'class-transformer';
import { User, $Enums, ProjectRole } from '@prisma/client';
import { ProjectResponse } from './dto/response/project.response';
import { StorageService } from 'src/storage/storage.service';
import { PublicFileRef } from 'src/storage/common/file-ref';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService, private readonly storage: StorageService) {}

  private isAdmin(u: User) { return u.role === $Enums.Role.ADMIN; }

  private async nextProjectCode(): Promise<string> {
    const counter = await this.prisma.counter.upsert({
      where: { id: 'project' },
      update: { value: { increment: 1 } },
      create: { id: 'project', value: 1 },
      select: { value: true },
    });
    const code = counter.value;
    return 'PN' + String(code).padStart(6, '0');
  }

  async create(
    user: User,
    dto: CreateProjectDto,
    files: { avatarFile?: Express.Multer.File },
  ): Promise<ProjectResponse> {
    let avatarPayload: Record<'name', string> | PublicFileRef;

    if (files.avatarFile) {
      const file = files.avatarFile;
      const ref = await this.storage.uploadAndMakeRef({
        buffer: file.buffer,
        mime: file.mimetype,
        originalName: file.originalname,
        prefix: `projects/${user.id}/avatars`,
        public: true,
      });

      avatarPayload = {
        url: ref.url!,
        name: ref.name ?? 'file',
        mime: ref.mime,
        size: ref.size,
        uploadedAt: ref.uploadedAt!,
      };
    } else {
      avatarPayload = { name: dto.avatar!.trim() };
    }

    const project = await this.prisma.project.create({
      data: {
        code: await this.nextProjectCode(),
        name: dto.name,
        description: dto.description,
        priority: dto.priority,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        deadline: dto.deadline ? new Date(dto.deadline) : null,
        ownerId: user.id,
        avatar: avatarPayload,
        members: { create: { userId: user.id, role: ProjectRole.OWNER } },
      },
      select: {
        id: true, code: true, name: true, description: true,
        priority: true, startDate: true, deadline: true,
        createdAt: true, updatedAt: true,
        avatar: true,
        ownerId: true,
        members: { where: { userId: user.id }, select: { role: true } },
      },
    });


    const myRole = project.members[0]?.role ?? ProjectRole.OWNER;
    const { members, ownerId, ...rest } = project;
    return plainToInstance(ProjectResponse, { ...rest, myRole });
  }

  async list(user: User): Promise<ProjectResponse[]> {
    const items = await this.prisma.project.findMany({
      where: { members: { some: { userId: user.id } } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        priority: true,
        startDate: true,
        deadline: true,
        createdAt: true,
        updatedAt: true,
        avatar: true,
        members: { where: { userId: user.id }, select: { role: true } },
      },
    });

    return items.map(project => {
      const myRole = project.members[0]?.role ?? ProjectRole.VIEWER;
      const { members, ...rest } = project;
      return plainToInstance(ProjectResponse, { ...rest, myRole });
    });
  }

  async getOne(user: User, id: string): Promise<ProjectResponse> {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: { members: { where: { userId: user.id }, select: { role: true } } },
    });
    if (!project) throw new NotFoundException('Project not found');

    const myRole = project.members[0]?.role;
    if (!this.isAdmin(user) && !myRole) {
      throw new ForbiddenException('No access to this project');
    }

    const { members, ownerId, ...rest } = project;
    return plainToInstance(ProjectResponse, { ...rest, myRole: myRole ?? ProjectRole.VIEWER });
  }

  async update(user: User, id: string, dto: UpdateProjectDto): Promise<ProjectResponse> {
    const membership = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: id, userId: user.id } },
      select: { role: true },
    });

    if (!this.isAdmin(user) && membership?.role !== ProjectRole.OWNER) {
      throw new ForbiddenException('Only owner can update project');
    }

    const updatedProject = await this.prisma.project.update({
      where: { id },
      data: {
        name: dto.name ?? undefined,
        description: dto.description ?? undefined,
        priority: (dto.priority as any) ?? undefined,
        avatar: dto.avatar ? { name: dto.avatar.trim() } : undefined,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        deadline: dto.deadline ? new Date(dto.deadline) : undefined,
      },
      include: { members: { where: { userId: user.id }, select: { role: true } } },
    });

    const myRole = updatedProject.members[0]?.role ?? ProjectRole.OWNER;
    const { members, ownerId, ...updated } = updatedProject;
    return plainToInstance(ProjectResponse, {
      ...updated,
      myRole,
    });
  }
}
