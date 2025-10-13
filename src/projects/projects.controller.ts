import { Controller, Get, Post, Body, Patch, Param, UseInterceptors, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, UploadedFile, BadRequestException, ClassSerializerInterceptor } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { User } from '@prisma/client';
import { ProjectResponse } from './dto/response/project.response';
import { Authorized } from '../common/decorators/authorized.decorator';
import { Authorization } from '../common/decorators/authorization.decorator';
import { memoryStorage } from 'multer';

@UseInterceptors(ClassSerializerInterceptor)
@ApiTags('Projects')
@Authorization()
@ApiBearerAuth()
@Controller('projects')
export class ProjectsController {
  constructor(private readonly service: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Create project' })
  @ApiOkResponse({ type: ProjectResponse })
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FileInterceptor('avatar', {
    storage: memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
  }))
  @ApiBody({
    schema: {
      oneOf: [
        {
          type: 'object',
          required: ['name', 'avatar'],
          properties: {
            name:        { type: 'string' },
            description: { type: 'string' },
            priority:    { type: 'string', enum: ['LOW','MEDIUM','HIGH'], default: 'MEDIUM' },
            startDate:    { type: 'string', format: 'date-time' },
            deadline:    { type: 'string', format: 'date-time' },
            avatar:      { type: 'string', description: 'preset name' },
          },
        },
        {
          type: 'object',
          required: ['name', 'avatar'],
          properties: {
            name:        { type: 'string' },
            description: { type: 'string' },
            priority:    { type: 'string', enum: ['LOW','MEDIUM','HIGH'], default: 'MEDIUM' },
            startDate:    { type: 'string', format: 'date-time' },
            deadline:    { type: 'string', format: 'date-time' },
            avatar:      { type: 'string', format: 'binary', description: 'image file' },
          },
        },
      ],
    },
  })
  async createProject(
    @Authorized() user: User,
    @Body() dto: CreateProjectDto,
    @UploadedFile(new ParseFilePipe({
      fileIsRequired: false,
      validators: [
        new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
        new FileTypeValidator({ fileType: /image\/(png|jpe?g|webp|gif)/ }),
      ],
    })) avatarFile?: Express.Multer["File"],
  ) {
    if (!avatarFile && !dto.avatar?.trim()) {
      throw new BadRequestException('avatar is required: provide a preset name or upload a file');
    }
    return this.service.create(user, dto, { avatarFile });
  }

  @Get()
  @ApiOperation({ summary: 'List my projects' })
  getProjects(@Authorized() user: User) {
    return this.service.list(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by id' })
  @ApiOkResponse({ type: ProjectResponse })
  getProject(@Authorized() user: User, @Param('id') id: string) {
    return this.service.getOne(user, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update project (owner only)' })
  @ApiOkResponse({ type: ProjectResponse })
  updateProject(@Authorized() user: User, @Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.service.update(user, id, dto);
  }
}
