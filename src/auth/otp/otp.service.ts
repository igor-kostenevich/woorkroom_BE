import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomInt } from 'crypto';
import { hash, verify } from 'argon2';
import { SmsService } from '../sms/sms.service';
import { normalizeToE164 } from '../../utils/phone.util';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class OtpService {
  private codeTtl: number;
  private resendCooldown: number;
  private maxAttempts: number;
  private defaultRegion: string;

  constructor(
    private readonly sms: SmsService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) {
    this.codeTtl = Number(this.config.get('SMS_CODE_TTL_SEC', 90));
    this.resendCooldown = Number(this.config.get('SMS_RESEND_COOLDOWN_SEC', 60));
    this.maxAttempts = Number(this.config.get('SMS_MAX_ATTEMPTS', 5));
    this.defaultRegion = this.config.get<string>('DEFAULT_PHONE_REGION', 'UA');
  }

  private otpKey(phoneE164: string) { return `otp:${phoneE164}`; }
  private rlKey(phoneE164: string) { return `otp:rl:${phoneE164}`; }

  async request(rawPhone: string) {
    const phone = normalizeToE164(rawPhone, this.defaultRegion);

    const rlKey = this.rlKey(phone);
    const already = await this.redis.get(rlKey);
    if (already) throw new BadRequestException('Please wait before requesting another code');
    await this.redis.set(rlKey, '1', 'EX', this.resendCooldown);

    const code = String(randomInt(0, 10000)).padStart(4, '0');
    const otpKey = this.otpKey(phone);

    await this.redis.set(
      otpKey,
      JSON.stringify({ hash: await hash(code), attempts: 0 }),
      'EX',
      this.codeTtl,
    );

    await this.sms.send(phone, `Your code: ${code}. Avilable ${this.codeTtl} sec.`);
    return { ok: true, ttl: this.codeTtl };
  }

  async verify(rawPhone: string, code: string) {
    const phone = normalizeToE164(rawPhone, this.defaultRegion);
    const otpKey = this.otpKey(phone);
    const data = await this.redis.get(otpKey);
    if (!data) throw new BadRequestException('Code expired or not found');

    const parsed = JSON.parse(data) as { hash: string; attempts: number };
    if (parsed.attempts >= this.maxAttempts) {
      await this.redis.del(otpKey);
      throw new BadRequestException('Too many attempts');
    }

    const ok = await verify(parsed.hash, code);
    if (!ok) {
      parsed.attempts++;
      await this.redis.set(otpKey, JSON.stringify(parsed), 'EX', this.codeTtl);
      throw new BadRequestException('Invalid code');
    }

    await this.redis.del(otpKey);
    return { ok: true, phone };
  }
}
