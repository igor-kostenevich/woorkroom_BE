import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { hash, verify } from 'argon2';
import { RedisService } from 'src/redis/redis.service';

type SessionRecord = {
  userId: string;
  tokenHash: string;
  ua?: string;
  ip?: string;
  createdAt: string;
};

@Injectable()
export class SessionService {
  private refreshTtlSec: number;

  constructor(
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) {
    this.refreshTtlSec = this.parseTtl(this.config.get('JWT_REFRESH_TOKEN_TTL') || '7d');
  }

  private key(sid: string) { return `session:${sid}`; }

  private parseTtl(ttl: string): number {
    const num = Number(ttl);
    if (!Number.isNaN(num)) return num;
    const m = ttl.match(/^(\d+)([smhd])$/i);
    if (!m) return 7 * 24 * 3600;
    const mult = { s: 1, m: 60, h: 3600, d: 86400 } as const;
    return parseInt(m[1], 10) * mult[m[2] as keyof typeof mult];
  }

  async create(userId: string, refreshToken: string, meta: { ua?: string; ip?: string }) {
    const sid = randomUUID();
    const rec: SessionRecord = {
      userId,
      tokenHash: await hash(refreshToken),
      ua: meta.ua,
      ip: meta.ip,
      createdAt: new Date().toISOString(),
    };
    await this.redis.set(this.key(sid), JSON.stringify(rec), 'EX', this.refreshTtlSec);
    return sid;
  }

  async verifyAndRotate(sid: string, refreshToken: string) {
    const raw = await this.redis.get(this.key(sid));
    if (!raw) throw new UnauthorizedException('Session not found');
    const rec = JSON.parse(raw) as SessionRecord;
    const ok = await verify(rec.tokenHash, refreshToken);
    if (!ok) throw new UnauthorizedException('Invalid refresh token');
    return rec.userId;
  }

  async updateTokenHash(sid: string, newRefresh: string) {
    const raw = await this.redis.get(this.key(sid));
    if (!raw) return;
    const rec = JSON.parse(raw) as SessionRecord;
    rec.tokenHash = await hash(newRefresh);
    await this.redis.set(this.key(sid), JSON.stringify(rec), 'EX', this.refreshTtlSec);
  }

  async destroy(sid: string) {
    await this.redis.del(this.key(sid));
  }
}
