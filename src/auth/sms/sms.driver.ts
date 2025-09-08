export interface SmsDriver {
  send(toE164: string, message: string): Promise<void>;
}