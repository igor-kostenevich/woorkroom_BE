import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private resend: Resend;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    if (!apiKey) throw new InternalServerErrorException('RESEND_API_KEY not found');
    this.resend = new Resend(apiKey);
  }

  async sendResetPassword(email: string, newPassword: string) {
    const domain = this.config.getOrThrow<string>('DOMAIN_URL');

    try {
      await this.resend.emails.send({
        from: 'Woorkroom <onboarding@resend.dev>',
        to: email,
        subject: 'Your Woorkroom password has been reset',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2>🔐 Password Reset</h2>
            <p>Your new temporary password:</p>
            <div style="font-size: 20px; font-weight: bold; color: #1a73e8; margin: 10px 0;">
              ${newPassword}
            </div>
            <p>Please log in to <a href="${domain}" target="_blank">Woorkroom</a> and change it in your profile settings.</p>
            <hr style="border:none; border-top:1px solid #ddd; margin:20px 0;">
            <small style="color:#888;">If you did not request this change, you can safely ignore this email.</small>
          </div>
        `,
      });
      return { success: true };
    } catch (err) {
      console.error('Resend error:', err);
      throw new InternalServerErrorException('Failed to send email');
    }
  }
}
