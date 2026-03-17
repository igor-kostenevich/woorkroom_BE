import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Role, ProjectRole } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { EmployeeResponse } from './dto/response/employee.response';
import { toPublicRef } from '../utils/to-public-ref.util';

const EMPLOYEE_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  position: true,
  location: true,
  avatar: true,
  role: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: { projectMemberships: true },
  },
} as const;

interface EmployeeRow {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  phone: string | null;
  position: string | null;
  location: string | null;
  avatar: unknown;
  role: string;
  createdAt: Date;
  updatedAt: Date;
  _count: { projectMemberships: number };
}

function mapUserToEmployeeResponse(row: EmployeeRow): Record<string, unknown> {
  return {
    id: row.id,
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
    role: row.role,
    position: row.position,
    location: row.location,
    phone: row.phone,
    avatar: toPublicRef(row.avatar as never),
    createdAt: row.createdAt,
    projectsCount: row._count.projectMemberships,
  };
}

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<EmployeeResponse[]> {
    const rows = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: EMPLOYEE_SELECT,
    });

    const mapped = rows.map((r) => mapUserToEmployeeResponse(r as EmployeeRow));
    return plainToInstance(EmployeeResponse, mapped);
  }

  async deleteById(currentUser: User, id: string): Promise<void> {
    if (currentUser.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admin can delete employees');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('Employee not found');
    }

    const ownedProjectsCount = await this.prisma.project.count({
      where: { ownerId: id },
    });
    if (ownedProjectsCount > 0) {
      throw new BadRequestException(
        `Cannot delete employee: they own ${ownedProjectsCount} project(s). Reassign or delete those projects first.`,
      );
    }

    await this.prisma.user.delete({
      where: { id },
    });
  }

  async reassignProjects(
    currentUser: User,
    id: string,
    newOwnerId: string,
  ): Promise<{ reassignedCount: number }> {
    if (currentUser.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admin can reassign projects');
    }

    if (id === newOwnerId) {
      throw new BadRequestException('New owner must be a different user');
    }

    const [employee, newOwner] = await Promise.all([
      this.prisma.user.findUnique({ where: { id }, select: { id: true } }),
      this.prisma.user.findUnique({ where: { id: newOwnerId }, select: { id: true } }),
    ]);

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }
    if (!newOwner) {
      throw new NotFoundException('New owner user not found');
    }

    const projects = await this.prisma.project.findMany({
      where: { ownerId: id },
      select: { id: true },
    });

    if (projects.length === 0) {
      return { reassignedCount: 0 };
    }

    await this.prisma.$transaction(async (tx) => {
      for (const project of projects) {
        await tx.project.update({
          where: { id: project.id },
          data: { ownerId: newOwnerId },
        });
        await tx.projectMember.upsert({
          where: {
            projectId_userId: { projectId: project.id, userId: newOwnerId },
          },
          create: {
            projectId: project.id,
            userId: newOwnerId,
            role: ProjectRole.OWNER,
          },
          update: { role: ProjectRole.OWNER },
        });
        await tx.projectMember.deleteMany({
          where: { projectId: project.id, userId: id },
        });
      }
    });

    return { reassignedCount: projects.length };
  }
}
