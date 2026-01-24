import { plainToInstance } from 'class-transformer';
import type { JwtPayload } from './interfaces/jwt.interface';
import { ConfigService } from '@nestjs/config';
import { RegisterRequest } from './dto/register.dto';
import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { hash, verify } from 'argon2'
import { LoginRequest } from './dto/login.dto';
import type { Response, Request } from 'express';
import type { Prisma } from '@prisma/client';
import { SessionService } from './session/session.service';
import { StorageService } from 'src/storage/storage.service';
import { MailService } from 'src/mail/mail.service';
import { randomInt } from 'crypto';
import { UserProfileResponse } from 'src/profile/dto/responses/profile.dto';


@Injectable()
export class AuthService {
  private readonly JWT_ACCESS_TOKEN_TTL: string
  private readonly JWT_REFRESH_TOKEN_TTL: string
  private readonly COOKIE_DOMAIN: string

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly sessions: SessionService,
    private readonly storage: StorageService,
    private readonly mailService: MailService,
  ) {
    this.JWT_ACCESS_TOKEN_TTL = this.configService.getOrThrow<string>('JWT_ACCESS_TOKEN_TTL')
    this.JWT_REFRESH_TOKEN_TTL = this.configService.getOrThrow<string>('JWT_REFRESH_TOKEN_TTL')
    this.COOKIE_DOMAIN = this.configService.getOrThrow<string>('COOKIE_DOMAIN')
  }

  // -------- PHONE TOKEN для multi-step --------
  async issuePhoneToken(e164: string) {
    return this.jwtService.sign(
      { phone: e164, purpose: 'phone-verified' },
      { expiresIn: '60m' } as JwtSignOptions,
    );
  }

  async attachPhone(userId: string, phoneToken: string) {
    const payload = await this.jwtService.verifyAsync<any>(phoneToken).catch(() => null);
    if (!payload || payload.purpose !== 'phone-verified' || !payload.phone) {
      throw new BadRequestException('Invalid phone token');
    }
    const updated = await this.prismaService.user.update({
      where: { id: userId },
      data: { phone: payload.phone, phoneVerified: true, phoneVerifiedAt: new Date() },
      select: { id: true, email: true, firstName: true, lastName: true, phone: true, address: true, role: true, createdAt: true, updatedAt: true }
    });
    return plainToInstance(UserProfileResponse, updated);
  }

  // ------------------- AUTH CORE -------------------

  async register(req: Request, res: Response, dto: RegisterRequest) {
    const { email, password, firstName, phoneToken, onboarding, company, invites } = dto

    const existUser = await this.prismaService.user.findUnique({ where: { email } })
    if (existUser) throw new ConflictException('User already exists')

    let phone: string | null = null
    let phoneVerified = false

    if (phoneToken) {
      const payload = await this.jwtService.verifyAsync<any>(phoneToken).catch(() => null);
      if (!payload || payload.purpose !== 'phone-verified') {
        throw new BadRequestException('Invalid phone token');
      }
      phone = payload.phone;
      phoneVerified = true;
    }

    const user = await this.prismaService.user.create({
      data: {
        email,
        password: await hash(password),
        firstName,
        phone,
        phoneVerified,
        phoneVerifiedAt: phoneVerified ? new Date() : null,
        onboarding: (onboarding ?? undefined) as Prisma.InputJsonValue | undefined,
        company:    (company ?? undefined) as Prisma.InputJsonValue | undefined,
        invitesDraft: (invites?.length ? invites : undefined) as Prisma.InputJsonValue | undefined,
      },
      select: { id: true }
    })

    return this.auth(req, res, user.id)
  }

  async login(req: Request, res: Response, dto: LoginRequest) {
    const { email, password, rememberMe } = dto

    const user = await this.prismaService.user.findUnique({
      where: { email },
      select: { id: true, password: true }
    })

    if(!user) throw new NotFoundException('Invalid credentials')

    const isPasswordValid = await verify(user.password, password)
    if (!isPasswordValid) throw new NotFoundException('Invalid credentials')

    return this.auth(req, res, user.id, rememberMe)
  }

  async refresh(req: Request, res: Response) {
    const refreshToken = req.cookies['refreshToken']
    const sid = req.cookies['sid']

    if(!refreshToken || !sid) throw new UnauthorizedException('Token not found')

    const payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken).catch(() => null)
    if(!payload?.id) throw new UnauthorizedException('Invalid token')

    const userId = await this.sessions.verifyAndRotate(sid, refreshToken)
      .catch(() => { throw new UnauthorizedException('Invalid session'); });

    if (userId !== payload.id) throw new UnauthorizedException('Session/user mismatch');

    const { accessToken, refreshToken: newRefresh } = this.generateTokens(userId)
    const exp = new Date(Date.now() + this.refreshMs())

    await this.sessions.updateTokenHash(sid, newRefresh)
    this.setCookie(res, 'refreshToken', newRefresh, exp)
    this.setCookie(res, 'sid', sid, exp)

    return { accessToken }
  }

  async logout(req: Request, res: Response) {
    const sid = req.cookies['sid']
    if (sid) await this.sessions.destroy(sid)
    this.setCookie(res, 'refreshToken', '', new Date(0))
    this.setCookie(res, 'sid', '', new Date(0))
    return true
  }

  async forgot(email: string) {
    const user = await this.prismaService.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('User not found');

    const newPassword = randomInt(100000, 999999).toString();

    const hashed = await hash(newPassword);

    await this.prismaService.user.update({
      where: { id: user.id },
      data: { password: hashed },
    });

    await this.mailService.sendResetPassword(email, newPassword);

    return { ok: true, message: 'New password has been sent to your email.' };
  }

  async validate(id: string) {
    const user = await this.prismaService.user.findUnique({ 
      where: { id }, 
      select: { id: true, role: true } 
    })
    if(!user) throw new NotFoundException('User not found')
    return user
  }

  // -------------------- helpers --------------------

  private auth(req: Request, res: Response, id: string, rememberMe = false) {
    const { accessToken, refreshToken } = this.generateTokens(id)

    const exp = rememberMe
    ? new Date(Date.now() + this.refreshMs())
    : undefined

    const ua = req.headers['user-agent'] || undefined;
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip;

    return this.sessions.create(id, refreshToken, { ua, ip }).then(sid => {
      this.setCookie(res, 'refreshToken', refreshToken, exp)
      this.setCookie(res, 'sid', sid, exp)
      return { accessToken }
    })
  }

  private generateTokens(id: string) {
    const payload: JwtPayload = { id }
    const accessToken = this.jwtService.sign(payload, { expiresIn: this.JWT_ACCESS_TOKEN_TTL } as JwtSignOptions)
    const refreshToken = this.jwtService.sign(payload, { expiresIn: this.JWT_REFRESH_TOKEN_TTL } as JwtSignOptions)
    return { accessToken, refreshToken }
  }

  private refreshMs() {
    const ttl = this.JWT_REFRESH_TOKEN_TTL;
    const m = ttl.match(/^(\d+)([smhd])$/i);
    if (!m) return 7 * 24 * 3600 * 1000;
    const mult = { s: 1e3, m: 60e3, h: 3600e3, d: 86400e3 } as const;
    return parseInt(m[1], 10) * mult[m[2] as keyof typeof mult];
  }

  private setCookie(res: Response, name: string, value: string, expires: Date | undefined) {
    res.cookie(name, value, {
      httpOnly: true,
      domain: this.COOKIE_DOMAIN,
      secure: true,
      sameSite: 'none',
      expires,
    })
  }
}
