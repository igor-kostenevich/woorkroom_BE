import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { setupSwagger } from './utils/swagger.util';
import { ConfigService } from '@nestjs/config';
import { CustomLogger } from './common/logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(
    ConfigService<{
      PORT?: string;
      NODE_ENV?: string;
      ALLOWED_ORIGINS?: string;
      COOKIE_SECRET?: string;
    }>
  );

  app.useLogger(new CustomLogger());
  app.use(helmet());
  app.use(cookieParser(config.get('COOKIE_SECRET')));

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      disableErrorMessages: false, // isprod = true
    })
  );

  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  const allowed = (config.get('ALLOWED_ORIGINS') || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      if (allowed.length === 0 || allowed.includes(origin)) return cb(null, true);
      return cb(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    exposedHeaders: ['Set-Cookie', 'Content-Disposition'],
  });

  setupSwagger(app); 

  await app.listen(Number(config.get('PORT')) || 3010, '0.0.0.0');
}
bootstrap();
