import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { BadRequestException } from '@nestjs/common';

export function normalizeToE164(raw: string, defaultRegion = 'UA'): string {
  const p = parsePhoneNumberFromString(String(raw || ''), defaultRegion as any);
  if (!p || !p.isValid()) throw new BadRequestException('Invalid phone number');
  return p.number;
}
