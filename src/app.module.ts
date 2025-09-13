import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { StorageModule } from './storage/storage.module';
import { AuthModule } from './auth/auth.module';
import { RedisModule } from './redis/redis.module';
import { ProjectsModule } from './projects/projects.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
    }),
    PrismaModule,
    RedisModule,
    StorageModule,
    AuthModule,
    ProjectsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
