import { UpdateProfileRequest } from './dto/updateProfile.dto';
import { AuthResponse } from './dto/auth.dto';
import { Body, ClassSerializerInterceptor, Controller, Get, HttpCode, Patch, Post, Req, Res, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator } from '@nestjs/common';
import { UserProfileResponse } from './dto/responses/profile.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiOkResponse, ApiConflictResponse, ApiBadRequestResponse, ApiNotFoundResponse, ApiUnauthorizedResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Authorization } from '../common/decorators/authorization.decorator';
import { Authorized } from '../common/decorators/authorized.decorator';
import { AuthService } from './auth.service';
import { RegisterRequest } from './dto/register.dto';
import { LoginRequest } from './dto/login.dto';
import type { Response, Request } from 'express'
import { User } from '@prisma/client';
import { OtpService } from './otp/otp.service';
import { RequestOtpDto, VerifyOtpDto } from './otp/dto/otp.dto';
import { memoryStorage } from 'multer';
import type { Express } from 'express';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly otp: OtpService,
  ) {}

  @ApiOperation({ summary: 'Request phone OTP' })
  @Post('phone/request')
  @HttpCode(200)
  async requestPhone(@Body() dto: RequestOtpDto) {
    return this.otp.request(dto.phone);
  }

  @ApiOperation({ summary: 'Verify phone OTP (returns phoneToken for registration)' })
  @Post('phone/verify')
  @HttpCode(200)
  async verifyPhone(@Body() dto: VerifyOtpDto) {
    const { phone } = await this.otp.verify(dto.phone, dto.code);
    const phoneToken = await this.authService.issuePhoneToken(phone);
    return { ok: true, phoneToken };
  }

  @ApiOperation({ summary: 'Attach verified phone to current user' })
  @Authorization()
  @Post('phone/attach')
  @HttpCode(200)
  async attachPhone(@Authorized() user: User, @Body() body: { phoneToken: string }) {
    return this.authService.attachPhone(user.id, body.phoneToken);
  }

  @ApiOperation({ summary: 'Register user' })
  @ApiOkResponse({ type: AuthResponse})
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiConflictResponse({ description: 'User already exists' })
  @Post('register')
  @HttpCode(201)
  async register(@Req() req: Request, @Res({passthrough: true}) res: Response, @Body() dto: RegisterRequest) {
    return await this.authService.register(req, res, dto)
  }

  @ApiOperation({ summary: 'Login user' })
  @ApiOkResponse({ type: AuthResponse})
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiNotFoundResponse({ description: 'Invalid credentials' })
  @Post('login')
  @HttpCode(200)
  async login(@Req() req: Request, @Res({passthrough: true}) res: Response, @Body() dto: LoginRequest) {
    return await this.authService.login(req, res, dto)
  }

  @ApiOperation({ summary: 'Refresh token' })
  @ApiOkResponse({ type: AuthResponse})
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() req: Request, @Res({passthrough: true}) res: Response) {
    return await this.authService.refresh(req, res)
  }

  @ApiOperation({ summary: 'Logout user' })
  @Post('logout')
  @HttpCode(200)
  async logout(@Req() req: Request, @Res({passthrough: true}) res: Response) {
    return await this.authService.logout(req, res)
  }

  @ApiOperation({ summary: 'Forgot password (send new password via email)' })
  @Post('forgot')
  @HttpCode(200)
  async forgot(@Body('email') email: string) {
    return this.authService.forgot(email);
  }

  @Authorization()
  @Get('profile')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  @ApiOkResponse({ type: UserProfileResponse })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async profile(@Authorized() user: User): Promise<UserProfileResponse> {
    return await this.authService.getProfile(user);
  }

  @Authorization()
  @Patch('profile')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile' })
  @ApiOkResponse({ type: UserProfileResponse })
  @ApiBadRequestResponse({ description: 'At least one field must be provided' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async updateProfile(@Authorized() user: User, @Body() dto: UpdateProfileRequest): Promise<UserProfileResponse> {
    return await this.authService.updateProfile(user, dto);
  }

  @Authorization()
  @Post('profile/avatar')
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
    return this.authService.setAvatar(user, file);
  }
}
