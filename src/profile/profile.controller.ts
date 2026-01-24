import { Body, ClassSerializerInterceptor, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator } from '@nestjs/common';
import { ApiOperation, ApiOkResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiBearerAuth, ApiConsumes, ApiBody, ApiParam } from '@nestjs/swagger';
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
import { CreateVacationRequestDto } from './dto/create-vacation-request.dto';
import { UpdateVacationRequestDto } from './dto/update-vacation-request.dto';
import { VacationRequestResponse } from './dto/responses/vacation-request.response';
import { AvailableDaysResponse } from './dto/responses/available-days.response';


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

  @Authorization()
  @Post('vacation-requests')
  @HttpCode(201)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create vacation request',
    description: 'Creates a new vacation/leave request',
  })
  @ApiOkResponse({
    description: 'Vacation request created',
    type: VacationRequestResponse,
  })
  @ApiBadRequestResponse({ description: 'Invalid data or date overlap' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async createVacationRequest(
    @Authorized() user: User,
    @Body() dto: CreateVacationRequestDto,
  ): Promise<VacationRequestResponse> {
    return this.profileService.createVacationRequest(user, dto);
  }

  @Authorization()
  @Get('vacation-requests')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get vacation requests',
    description: 'Returns list of all user vacation requests',
  })
  @ApiOkResponse({
    description: 'List of vacation requests',
    type: VacationRequestResponse,
    isArray: true,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getVacationRequests(
    @Authorized() user: User,
  ): Promise<VacationRequestResponse[]> {
    return this.profileService.getVacationRequests(user.id);
  }

  @Authorization()
  @Patch('vacation-requests/:id')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update vacation request',
    description: 'Updates vacation request (only for PENDING status)',
  })
  @ApiParam({ name: 'id', description: 'Request ID' })
  @ApiOkResponse({
    description: 'Vacation request updated',
    type: VacationRequestResponse,
  })
  @ApiBadRequestResponse({ description: 'Invalid data or request cannot be updated' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async updateVacationRequest(
    @Authorized() user: User,
    @Param('id') requestId: string,
    @Body() dto: UpdateVacationRequestDto,
  ): Promise<VacationRequestResponse> {
    return this.profileService.updateVacationRequest(user, requestId, dto);
  }

  @Authorization()
  @Delete('vacation-requests/:id')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cancel vacation request',
    description: 'Cancels vacation request. Users can cancel only their own PENDING requests. Managers and admins can cancel any request.',
  })
  @ApiParam({ name: 'id', description: 'Request ID' })
  @ApiOkResponse({
    description: 'Vacation request canceled',
    type: VacationRequestResponse,
  })
  @ApiBadRequestResponse({ description: 'Request cannot be canceled' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiUnauthorizedResponse({ description: 'Forbidden - insufficient permissions' })
  async cancelVacationRequest(
    @Authorized() user: User,
    @Param('id') requestId: string,
  ): Promise<VacationRequestResponse> {
    return this.profileService.cancelVacationRequest(user, requestId);
  }

  @Authorization()
  @Post('vacation-requests/:id/approve')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Approve vacation request',
    description: 'Approves vacation request. Only managers and admins can approve requests.',
  })
  @ApiParam({ name: 'id', description: 'Request ID' })
  @ApiOkResponse({
    description: 'Vacation request approved',
    type: VacationRequestResponse,
  })
  @ApiBadRequestResponse({ description: 'Request cannot be approved' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiUnauthorizedResponse({ description: 'Forbidden - only managers and admins can approve' })
  async approveVacationRequest(
    @Authorized() user: User,
    @Param('id') requestId: string,
  ): Promise<VacationRequestResponse> {
    return this.profileService.approveVacationRequest(user, requestId);
  }

  @Authorization()
  @Post('vacation-requests/:id/reject')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Reject vacation request',
    description: 'Rejects vacation request. Only managers and admins can reject requests.',
  })
  @ApiParam({ name: 'id', description: 'Request ID' })
  @ApiOkResponse({
    description: 'Vacation request rejected',
    type: VacationRequestResponse,
  })
  @ApiBadRequestResponse({ description: 'Request cannot be rejected' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiUnauthorizedResponse({ description: 'Forbidden - only managers and admins can reject' })
  async rejectVacationRequest(
    @Authorized() user: User,
    @Param('id') requestId: string,
  ): Promise<VacationRequestResponse> {
    return this.profileService.rejectVacationRequest(user, requestId);
  }

  @Authorization()
  @Get('vacation-requests/available-days')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get available vacation days',
    description: 'Returns available days information for each vacation type',
  })
  @ApiOkResponse({
    description: 'Available days information by type',
    type: AvailableDaysResponse,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getAvailableDays(
    @Authorized() user: User,
  ): Promise<AvailableDaysResponse> {
    return this.profileService.getAvailableDays(user.id);
  }
}
