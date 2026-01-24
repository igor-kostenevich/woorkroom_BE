import { plainToInstance } from 'class-transformer';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { hash, verify } from 'argon2'
import type { Multer } from 'multer';
import type { Prisma, User } from '@prisma/client';
import { UpdateProfileRequest } from '../profile/dto/updateProfile.dto';
import { StorageService } from 'src/storage/storage.service';
import { toPublicRef } from './../utils/to-public-ref.util';
import { FileRef } from 'src/storage/common/file-ref';
import { UserProfileResponse } from './dto/responses/profile.dto';
import { ProfileProjectResponse } from './dto/responses/profile-project.response';
import { mapUserBrief } from '../projects/mappers/project.mapper';

const ALLOWED = /^(image\/jpeg|image\/png|image\/webp|image\/gif)$/;

@Injectable()
export class ProfileService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async getProfile(user: User) {
    const p = await this.prismaService.user.findUnique({
      where: { id: user.id },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        phone: true, address: true, role: true,
        avatar: true, createdAt: true, updatedAt: true,
      },
    });
    if (!p) throw new NotFoundException('User not found');
  
    let ref = p.avatar as FileRef | null;
    if (ref && !ref.public) {
      ref = await this.storage.refreshUrl(ref, 300);
    }
  
    const avatar = toPublicRef(ref);
  
    return {
      id: p.id,
      email: p.email,
      firstName: p.firstName,
      lastName: p.lastName ?? '',
      fullName: `${p.firstName} ${p.lastName || ''}`.trim(),
      phone: p.phone,
      address: p.address,
      role: p.role,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      avatar,
    };
  }

  async updateProfile(user: User, dto: UpdateProfileRequest): Promise<UserProfileResponse> {
    if (!dto.hasAtLeastOneField()) {
      throw new BadRequestException('At least one field must be provided to update profile');
    }
    const { oldPassword, newPassword, repeatPassword, ...data }: Partial<UpdateProfileRequest & { password?: string }> = dto;

    if (oldPassword) {
      if (newPassword !== repeatPassword) throw new BadRequestException('New passwords do not match');

      const existing = await this.prismaService.user.findUnique({ where: { id: user.id }, select: { password: true } });

      if (!existing) throw new NotFoundException('User not found');

      const isValid = await verify(existing.password, oldPassword);

      if (!isValid) throw new BadRequestException('Incorrect current password');
      if (!newPassword) throw new BadRequestException('New password must be provided');

      data.password = await hash(newPassword);
    }

    const updatedUser = await this.prismaService.user.update({
      where: { id: user.id },
      data,
      select: {
        id: true, 
        email: true, 
        firstName: true, 
        lastName: true,
        phone: true, 
        address: true, 
        role: true,
        avatar: true,
        phoneVerified: true,
        phoneVerifiedAt: true,
        createdAt: true, 
        updatedAt: true
      },
    });

    return plainToInstance(UserProfileResponse, updatedUser);
  }

  async setAvatar(user: User, file: Express.Multer["File"]): Promise<UserProfileResponse> {
    if (!file) throw new BadRequestException('File is required');
    if (!ALLOWED.test(file.mimetype)) {
      throw new BadRequestException('Only jpeg/png/webp/gif allowed');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('Max file size is 5MB');
    }
  
    const ref = await this.storage.uploadAndMakeRef({
      buffer: file.buffer,
      mime: file.mimetype,
      originalName: file.originalname,
      prefix: `avatars/${user.id}`,
      public: true,
      signedTtlSec: 300,
    });
    
    const updated = await this.prismaService.user.update({
      where: { id: user.id },
      data: { avatar: ref as unknown as Prisma.InputJsonValue },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        phone: true, address: true, role: true,
        avatar: true, createdAt: true, updatedAt: true,
      },
    });
  
    return plainToInstance(UserProfileResponse, updated);
  }

  async getTeam(userId: string) {
    const memberships = await this.prismaService.projectMember.findMany({
      where: {
        project: {
          assignees: {
            some: { userId },
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
            avatar: true,
          },
        },
      },
    });
  
    const map = new Map<string, any>();
  
    for (const member of memberships) {
      if (member.user) {
        map.set(member.user.id, member.user);
      }
    }
  
    return Array.from(map.values()).map(u => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName ?? '',
      fullName: `${u.firstName} ${u.lastName || ''}`.trim(),
      position: u.position ?? null,
      avatar: toPublicRef(u.avatar),
    }));
  }

  async getProjects(userId: string): Promise<ProfileProjectResponse[]> {
    const projects = await this.prismaService.project.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { assignees: { some: { userId } } },
        ],
      },
      select: {
        id: true,
        code: true,
        name: true,
        avatar: true,
        priority: true,
        createdAt: true,
        assignees: {
          select: {
            role: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const results: ProfileProjectResponse[] = [];

    for (const project of projects) {
      let avatar: any = null;
      
      if (project.avatar) {
        const avatarData = project.avatar as any;
        if (avatarData.name && !avatarData.url) {
          avatar = { name: avatarData.name };
        } else if (avatarData.url) {
          let ref = avatarData as FileRef;
          if (ref && !ref.public) {
            ref = await this.storage.refreshUrl(ref, 300);
          }
          avatar = toPublicRef(ref);
        }
      }

      const assignees = project.assignees.map((a: any) => ({
        role: a.role,
        user: mapUserBrief(a.user),
      }));

      results.push({
        id: project.id,
        code: project.code,
        name: project.name,
        avatar,
        priority: project.priority,
        createdAt: project.createdAt,
        allTasksCount: 0, // TODO: add tasks count
        activeTasksCount: 0, // TODO: add active tasks count
        assignees,
      });
    }

    return plainToInstance(ProfileProjectResponse, results);
  }

}
