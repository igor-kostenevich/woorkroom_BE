import { Body, ClassSerializerInterceptor, Controller, Get, HttpCode, Patch, Post, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator } from '@nestjs/common';
import { ApiOperation, ApiOkResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { memoryStorage } from 'multer';
import { FileInterceptor } from '@nestjs/platform-express';
import { Authorization } from '../common/decorators/authorization.decorator';
import { Authorized } from '../common/decorators/authorized.decorator';
import type { Express } from 'express';
import { User } from '@prisma/client';
import { UpdateProfileRequest } from './dto/updateProfile.dto';
import { UserProfileResponse } from './dto/responses/profile.dto';
import { ProfileTeamMemberResponse } from './dto/responses/profile-team.response';
import { ProfileProjectResponse } from './dto/responses/profile-project.response';


@UseInterceptors(ClassSerializerInterceptor)
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Authorization()
  @Get('')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  @ApiOkResponse({ type: UserProfileResponse })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async profile(@Authorized() user: User): Promise<UserProfileResponse> {
    return await this.profileService.getProfile(user);
  }

  @Authorization()
  @Patch('')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile' })
  @ApiOkResponse({ type: UserProfileResponse })
  @ApiBadRequestResponse({ description: 'At least one field must be provided' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async updateProfile(@Authorized() user: User, @Body() dto: UpdateProfileRequest): Promise<UserProfileResponse> {
    return await this.profileService.updateProfile(user, dto);
  }

  @Authorization()
  @Post('/avatar')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
  }))
  @ApiOperation({ summary: 'Upload user avatar' })
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  async uploadAvatar(
    @Authorized() user: User,
    @UploadedFile(new ParseFilePipe({
      validators: [
        new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
        new FileTypeValidator({ fileType: /image\/(jpeg|png|webp|gif)/ }),
      ],
    })) file: Express.Multer["File"],
  ) {
    return this.profileService.setAvatar(user, file);
  }

  @Authorization()
  @Get('team')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user team',
    description:
      'Returns users that participate in at least one project together with the current user.',
  })
  @ApiOkResponse({
    description: 'List of team members',
    type: ProfileTeamMemberResponse,
    isArray: true,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getTeam(
    @Authorized() user: User,
  ): Promise<ProfileTeamMemberResponse[]> {
    return this.profileService.getTeam(user.id);
  }

  @Authorization()
  @Get('projects')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user projects',
    description:
      'Returns all projects where the user is either owner or member.',
  })
  @ApiOkResponse({
    description: 'List of user projects',
    type: ProfileProjectResponse,
    isArray: true,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getProjects(
    @Authorized() user: User,
  ): Promise<ProfileProjectResponse[]> {
    return this.profileService.getProjects(user.id);
  }
}
