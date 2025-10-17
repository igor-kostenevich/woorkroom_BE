import { JwtStrategy } from './strategies/jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt'
import { getJwtConfig } from 'src/config/jwt.config';
import { PassportModule } from '@nestjs/passport';
import { OtpService } from './otp/otp.service';
import { SmsService } from './sms/sms.service';
import { SessionService } from './session/session.service';
import { RedisModule } from 'src/redis/redis.module';
import { StorageModule } from 'src/storage/storage.module';
import { TelegramModule } from 'src/telegram/telegram.module';

@Module({
  imports: [
    PassportModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getJwtConfig,
    }),
    RedisModule,
    StorageModule,
    TelegramModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, OtpService, SmsService, SessionService],
  exports: [JwtModule],
})
export class AuthModule {}
