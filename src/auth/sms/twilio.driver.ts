import { ConfigService } from '@nestjs/config';
import { SmsDriver } from './sms.driver';
import { Twilio } from 'twilio';

export class TwilioSmsDriver implements SmsDriver {
  private readonly client: InstanceType<typeof Twilio>;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    const sid = this.config.getOrThrow<string>('TWILIO_ACCOUNT_SID');
    const token = this.config.getOrThrow<string>('TWILIO_AUTH_TOKEN');
    this.from = this.config.getOrThrow<string>('TWILIO_FROM_NUMBER');

    if (!/^\+\d{6,}$/.test(this.from)) {
      throw new Error('TWILIO_FROM_NUMBER must be in E.164 format, e.g. +18646136598');
    }

    this.client = new Twilio(sid, token);
  }

  async send(toE164: string, message: string): Promise<void> {
    const to = toE164.replace(/\s+/g, '');
    try {
      await this.client.messages.create({ from: this.from, to, body: message });
    } catch (e: any) {
      const code = e?.code ?? e?.status ?? 'unknown';
      const msg = e?.message ?? 'Twilio send failed';
      throw new Error(`Twilio error (${code}): ${msg}`);
    }
  }
}
