import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SmsDriver } from './sms.driver';
import { ConsoleSmsDriver } from './console.driver';
import { TwilioSmsDriver } from './twilio.driver';

@Injectable()
export class SmsService {
  private readonly driver: SmsDriver;

  constructor(private readonly config: ConfigService) {
    const raw = this.config.getOrThrow<string>('SMS_DRIVER') ?? 'console';
    const drv = raw.trim().toLowerCase();

    this.driver = drv === 'twilio'
      ? new TwilioSmsDriver(this.config)
      : new ConsoleSmsDriver();
  }

  send(toE164: string, message: string): Promise<void> {
    return this.driver.send(toE164, message);
  }
}

export default SmsService;
