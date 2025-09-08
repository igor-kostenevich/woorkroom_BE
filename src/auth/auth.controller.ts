import { UpdateProfileRequest } from './dto/updateProfile.dto';
import { AuthResponse } from './dto/auth.dto';
import { Body, ClassSerializerInterceptor, Controller, Get, HttpCode, Patch, Post, Req, Res, UseInterceptors } from '@nestjs/common';
import { UserProfileResponse } from './dto/responses/profile.dto';
import { Authorization } from './decorators/authorization.decorator';
import { ApiOperation, ApiOkResponse, ApiConflictResponse, ApiBadRequestResponse, ApiNotFoundResponse, ApiUnauthorizedResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterRequest } from './dto/register.dto';
import { LoginRequest } from './dto/login.dto';
import type { Response, Request } from 'express'
import { Authorized } from './decorators/authorized.decorator';
import { User } from '@prisma/client';
import { OtpService } from './otp/otp.service';
import { RequestOtpDto, VerifyOtpDto } from './otp/dto/otp.dto';

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
}
