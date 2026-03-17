import { Body, ClassSerializerInterceptor, Controller, HttpCode, Patch, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiBadRequestResponse, ApiOkResponse, ApiOperation, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { DevToolsService } from './dev-tools.service';
import { Authorization } from '../common/decorators/authorization.decorator';
import { Authorized } from '../common/decorators/authorized.decorator';
import { User } from '@prisma/client';
import { ChangeRoleDto } from './dto/change-role.dto';
import { UserProfileResponse } from 'src/profile/dto/responses/profile.dto';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('dev-tools')
export class DevToolsController {
  constructor(private readonly devToolsService: DevToolsService) {}

  @Authorization()
  @Patch('role')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Змінити власну роль (dev tools)',
    description: 'Дозволяє авторизованому користувачу змінити роль самому собі. Використовується лише для dev/testing.',
  })
  @ApiOkResponse({ description: 'Оновлений профіль користувача', type: UserProfileResponse })
  @ApiBadRequestResponse({ description: 'Некоректні дані або невідома роль' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async changeOwnRole(
    @Authorized() user: User,
    @Body() dto: ChangeRoleDto,
  ): Promise<UserProfileResponse> {
    return this.devToolsService.changeOwnRole(user, dto);
  }
}

