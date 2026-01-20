import { AuthResponse } from './dto/auth.dto';
import { Body, ClassSerializerInterceptor, Controller, HttpCode, Post, Req, Res, UseInterceptors } from '@nestjs/common';
import { ApiOperation, ApiOkResponse, ApiConflictResponse, ApiBadRequestResponse, ApiNotFoundResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Authorization } from '../common/decorators/authorization.decorator';
import { Authorized } from '../common/decorators/authorized.decorator';
import { AuthService } from './auth.service';
import { RegisterRequest } from './dto/register.dto';
import { LoginRequest } from './dto/login.dto';
import type { Response, Request } from 'express'
import { User } from '@prisma/client';
import { OtpService } from './otp/otp.service';
import { RequestOtpDto, VerifyOtpDto } from './otp/dto/otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';

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

  @ApiOperation({
    summary: 'Forgot password',
    description: 'Sends a new temporary password to the provided email address.',
  })
  @ApiOkResponse({
    description: 'New password has been sent to user email',
    schema: {
      example: {
        success: true,
        message: 'Password reset email sent successfully',
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid or missing email' })
  @ApiNotFoundResponse({ description: 'User with this email not found' })
  @Post('forgot')
  @HttpCode(200)
  async forgot(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgot(dto.email);
  }
}
