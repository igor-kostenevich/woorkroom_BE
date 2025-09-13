import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { StorageModule } from 'src/storage/storage.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [StorageModule, PrismaModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
})
export class ProjectsModule {}
