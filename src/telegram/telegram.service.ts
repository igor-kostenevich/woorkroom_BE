import { Injectable } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TelegramService {
  private bot: TelegramBot;
  private chatId: string;

  constructor(private readonly configService: ConfigService) {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    const chatId = this.configService.get<string>('TELEGRAM_CHAT_ID');
    
    if (!chatId) {
      throw new Error('TELEGRAM_CHAT_ID is not defined in the configuration');
    }
    this.chatId = chatId;
    this.bot = new TelegramBot(token, { polling: false });
  }

  async sendMessage(message: string) {
    try {
      await this.bot.sendMessage(this.chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('❌ Failed to send Telegram message:', error);
    }
  }
}
