import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiOperation, ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { EmployeeResponse } from './dto/response/employee.response';
import { ReassignProjectsDto } from './dto/reassign-projects.dto';
import { Authorization } from '../common/decorators/authorization.decorator';
import { Authorized } from '../common/decorators/authorized.decorator';
import { User } from '@prisma/client';

@UseInterceptors(ClassSerializerInterceptor)
@ApiTags('Employees')
@Authorization()
@ApiBearerAuth()
@Controller('employees')
export class EmployeesController {
  constructor(private readonly service: EmployeesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all employees' })
  @ApiOkResponse({ type: [EmployeeResponse], description: 'List of all employees (users)' })
  findAll() {
    return this.service.findAll();
  }

  @Post(':id/reassign-projects')
  @ApiOperation({
    summary: 'Reassign all projects to another user',
    description: 'Transfers ownership of all projects from the given employee to another user. Only admin. Use before deleting an employee who owns projects.',
  })
  @ApiParam({ name: 'id', description: 'Employee (user) UUID whose projects will be reassigned' })
  @ApiOkResponse({ description: 'Number of projects reassigned', schema: { properties: { reassignedCount: { type: 'number' } } } })
  async reassignProjects(
    @Authorized() user: User,
    @Param('id') id: string,
    @Body() dto: ReassignProjectsDto,
  ) {
    return this.service.reassignProjects(user, id, dto.newOwnerId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete employee by id' })
  @ApiNoContentResponse({ description: 'Employee deleted successfully' })
  @ApiParam({ name: 'id', description: 'Employee (user) UUID' })
  async deleteById(@Authorized() user: User, @Param('id') id: string): Promise<void> {
    await this.service.deleteById(user, id);
  }
}
