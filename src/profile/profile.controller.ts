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
}
