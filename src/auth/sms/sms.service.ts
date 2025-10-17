import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SmsDriver } from './sms.driver';
import { ConsoleSmsDriver } from './console.driver';
import { TwilioSmsDriver } from './twilio.driver';
import { TelegramService } from 'src/telegram/telegram.service';

@Injectable()
export class SmsService {
  private readonly driver: SmsDriver;

  constructor(
    private readonly config: ConfigService,
    private readonly telegramService: TelegramService,
  ) {
    const raw = this.config.getOrThrow<string>('SMS_DRIVER') ?? 'console';
    const drv = raw.trim().toLowerCase();

    this.driver =
      drv === 'twilio'
        ? new TwilioSmsDriver(this.config)
        : new ConsoleSmsDriver();
  }

  async send(toE164: string, message: string): Promise<void> {
    const phone = toE164.replace(/\s+/g, '');
    const tgMessage = `📤 Send sms to ${phone}. ${message}`;

    await this.telegramService.sendMessage(tgMessage);

    return this.driver.send(phone, message);
  }
}

export default SmsService;
