import { plainToInstance } from 'class-transformer';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { hash, verify } from 'argon2'
import type { Multer } from 'multer';
import type { Prisma, User, VacationStatus, VacationType, Role } from '@prisma/client';
import { UpdateProfileRequest } from '../profile/dto/updateProfile.dto';
import { StorageService } from 'src/storage/storage.service';
import { toPublicRef } from './../utils/to-public-ref.util';
import { FileRef } from 'src/storage/common/file-ref';
import { UserProfileResponse } from './dto/responses/profile.dto';
import { ProfileProjectResponse } from './dto/responses/profile-project.response';
import { mapUserBrief } from '../projects/mappers/project.mapper';
import { CreateVacationRequestDto } from './dto/create-vacation-request.dto';
import { UpdateVacationRequestDto } from './dto/update-vacation-request.dto';
import { VacationRequestResponse } from './dto/responses/vacation-request.response';
import { AvailableDaysResponse } from './dto/responses/available-days.response';

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

  /**
   * Checks if user has manager or admin role
   */
  private isManagerOrAdmin(role: Role): boolean {
    return role === 'MANAGER' || role === 'ADMIN';
  }

  /**
   * Calculates the number of days between dates (inclusive)
   */
  private calculateDurationDays(startDate: Date, endDate: Date): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // +1 to include both days
  }

  /**
   * Returns the limit for a specific vacation type
   */
  private getVacationLimit(type: VacationType): number {
    const limits = {
      VACATION: 20,
      SICK: 10,
      REMOTE: 30,
    };
    return limits[type];
  }

  /**
   * Gets used days for a specific vacation type (only APPROVED requests)
   */
  private async getUsedDaysByType(
    userId: string,
    type: VacationType,
    excludeRequestId?: string,
  ): Promise<number> {
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59);

    const approvedRequests = await this.prismaService.vacationRequest.findMany({
      where: {
        userId,
        type,
        status: 'APPROVED',
        id: excludeRequestId ? { not: excludeRequestId } : undefined,
        startDate: { gte: yearStart },
        endDate: { lte: yearEnd },
      },
    });

    return approvedRequests.reduce((sum, request) => sum + request.durationDays, 0);
  }

  /**
   * Checks if the requested days exceed available limit
   */
  private async checkAvailableDays(
    userId: string,
    type: VacationType,
    requestedDays: number,
    excludeRequestId?: string,
  ): Promise<void> {
    const limit = this.getVacationLimit(type);
    const usedDays = await this.getUsedDaysByType(userId, type, excludeRequestId);
    const available = limit - usedDays;

    if (requestedDays > available) {
      throw new BadRequestException(
        `Insufficient available days. Requested: ${requestedDays}, Available: ${available}, Limit: ${limit}`,
      );
    }
  }

  async createVacationRequest(
    user: User,
    dto: CreateVacationRequestDto,
  ): Promise<VacationRequestResponse> {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (startDate > endDate) {
      throw new BadRequestException('Start date cannot be later than end date');
    }

    const durationDays = this.calculateDurationDays(startDate, endDate);

    // Check available days limit
    await this.checkAvailableDays(user.id, dto.type, durationDays);

    const request = await this.prismaService.vacationRequest.create({
      data: {
        userId: user.id,
        type: dto.type,
        startDate,
        endDate,
        durationDays,
        status: 'PENDING',
      },
    });

    return plainToInstance(VacationRequestResponse, request);
  }

  async getVacationRequests(userId: string): Promise<VacationRequestResponse[]> {
    const requests = await this.prismaService.vacationRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return plainToInstance(VacationRequestResponse, requests);
  }

  async updateVacationRequest(
    user: User,
    requestId: string,
    dto: UpdateVacationRequestDto,
  ): Promise<VacationRequestResponse> {
    if (!dto.hasAtLeastOneField()) {
      throw new BadRequestException('At least one date field must be provided for update');
    }

    const existingRequest = await this.prismaService.vacationRequest.findUnique({
      where: { id: requestId },
    });

    if (!existingRequest) {
      throw new NotFoundException('Vacation request not found');
    }

    if (existingRequest.userId !== user.id) {
      throw new ForbiddenException('Access denied to this request');
    }

    if (existingRequest.status !== 'PENDING') {
      throw new BadRequestException('Only requests with PENDING status can be edited');
    }

    const startDate = dto.startDate ? new Date(dto.startDate) : existingRequest.startDate;
    const endDate = dto.endDate ? new Date(dto.endDate) : existingRequest.endDate;

    if (startDate > endDate) {
      throw new BadRequestException('Start date cannot be later than end date');
    }

    const durationDays = this.calculateDurationDays(startDate, endDate);

    // Check available days limit (excluding current request since it's PENDING)
    await this.checkAvailableDays(user.id, existingRequest.type, durationDays, requestId);

    const updatedRequest = await this.prismaService.vacationRequest.update({
      where: { id: requestId },
      data: {
        startDate,
        endDate,
        durationDays,
      },
    });

    return plainToInstance(VacationRequestResponse, updatedRequest);
  }

  async cancelVacationRequest(
    user: User,
    requestId: string,
  ): Promise<VacationRequestResponse> {
    const existingRequest = await this.prismaService.vacationRequest.findUnique({
      where: { id: requestId },
    });

    if (!existingRequest) {
      throw new NotFoundException('Vacation request not found');
    }

    // User can cancel only their own PENDING requests
    // Manager/Admin can cancel any request
    if (!this.isManagerOrAdmin(user.role)) {
      if (existingRequest.userId !== user.id) {
        throw new ForbiddenException('Access denied to this request');
      }
      if (existingRequest.status !== 'PENDING') {
        throw new BadRequestException('Only requests with PENDING status can be canceled');
      }
    }

    const updatedRequest = await this.prismaService.vacationRequest.update({
      where: { id: requestId },
      data: { status: 'CANCELED' as VacationStatus },
    });

    return plainToInstance(VacationRequestResponse, updatedRequest);
  }

  async approveVacationRequest(
    user: User,
    requestId: string,
  ): Promise<VacationRequestResponse> {
    if (!this.isManagerOrAdmin(user.role)) {
      throw new ForbiddenException('Only managers and admins can approve requests');
    }

    const existingRequest = await this.prismaService.vacationRequest.findUnique({
      where: { id: requestId },
    });

    if (!existingRequest) {
      throw new NotFoundException('Vacation request not found');
    }

    if (existingRequest.status !== 'PENDING') {
      throw new BadRequestException('Only requests with PENDING status can be approved');
    }

    // Check available days before approving
    await this.checkAvailableDays(
      existingRequest.userId,
      existingRequest.type,
      existingRequest.durationDays,
    );

    const updatedRequest = await this.prismaService.vacationRequest.update({
      where: { id: requestId },
      data: { status: 'APPROVED' },
    });

    return plainToInstance(VacationRequestResponse, updatedRequest);
  }

  async rejectVacationRequest(
    user: User,
    requestId: string,
  ): Promise<VacationRequestResponse> {
    if (!this.isManagerOrAdmin(user.role)) {
      throw new ForbiddenException('Only managers and admins can reject requests');
    }

    const existingRequest = await this.prismaService.vacationRequest.findUnique({
      where: { id: requestId },
    });

    if (!existingRequest) {
      throw new NotFoundException('Vacation request not found');
    }

    if (existingRequest.status !== 'PENDING') {
      throw new BadRequestException('Only requests with PENDING status can be rejected');
    }

    const updatedRequest = await this.prismaService.vacationRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED' },
    });

    return plainToInstance(VacationRequestResponse, updatedRequest);
  }

  async getAvailableDays(userId: string): Promise<AvailableDaysResponse> {
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59);

    const approvedRequests = await this.prismaService.vacationRequest.findMany({
      where: {
        userId,
        status: 'APPROVED',
        startDate: { gte: yearStart },
        endDate: { lte: yearEnd },
      },
    });

    const usedByType = {
      VACATION: 0,
      SICK: 0,
      REMOTE: 0,
    };

    for (const request of approvedRequests) {
      usedByType[request.type] += request.durationDays;
    }

    const result = {
      VACATION: {
        limit: this.getVacationLimit('VACATION'),
        used: usedByType.VACATION,
        available: Math.max(0, this.getVacationLimit('VACATION') - usedByType.VACATION),
      },
      SICK: {
        limit: this.getVacationLimit('SICK'),
        used: usedByType.SICK,
        available: Math.max(0, this.getVacationLimit('SICK') - usedByType.SICK),
      },
      REMOTE: {
        limit: this.getVacationLimit('REMOTE'),
        used: usedByType.REMOTE,
        available: Math.max(0, this.getVacationLimit('REMOTE') - usedByType.REMOTE),
      },
    };

    return result;
  }

}
