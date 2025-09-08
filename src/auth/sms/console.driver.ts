import { SmsDriver } from './sms.driver';

export class ConsoleSmsDriver implements SmsDriver {
  async send(toE164: string, message: string) {
    console.log(`[SMS to ${toE164}] ${message}`);
  }
}
