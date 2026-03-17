import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { User } from '@prisma/client';
import { ChangeRoleDto } from './dto/change-role.dto';
import { plainToInstance } from 'class-transformer';
import { UserProfileResponse } from 'src/profile/dto/responses/profile.dto';

@Injectable()
export class DevToolsService {
  constructor(private readonly prisma: PrismaService) {}

  async changeOwnRole(user: User, dto: ChangeRoleDto): Promise<UserProfileResponse> {
    const existing = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        address: true,
        role: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        role: dto.role,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        address: true,
        role: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return plainToInstance(UserProfileResponse, updated);
  }
}

