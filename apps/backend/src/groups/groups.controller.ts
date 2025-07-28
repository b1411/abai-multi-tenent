import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupStatisticsDto } from './dto/group-statistics.dto';
import { PermissionGuard, RequirePermission } from '../common/guards/permission.guard';
import { RolesGuard } from '../common/guards/role.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from 'generated/prisma';
import { AuthGuard } from '../common/guards/auth.guard';

@ApiTags('Groups')
@Controller('groups')
@UseGuards(AuthGuard, PermissionGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) { }

  @Get('test')
  @ApiOperation({ summary: 'Тестовый endpoint без авторизации' })
  test() {
    return { message: 'Groups API works!', timestamp: new Date().toISOString() };
  }

  @Post()
  @RequirePermission('groups', 'create')
  @ApiOperation({ summary: 'Создать новую группу' })
  @ApiResponse({
    status: 201,
    description: 'Группа успешно создана',
  })
  @ApiResponse({
    status: 400,
    description: 'Неверные данные для создания группы',
  })
  @ApiResponse({
    status: 403,
    description: 'Недостаточно прав для создания группы',
  })
  create(@Body() createGroupDto: CreateGroupDto) {
    return this.groupsService.create(createGroupDto);
  }

  @Get()
  @RequirePermission('groups', 'read')
  @ApiOperation({ summary: 'Получить все группы' })
  @ApiResponse({
    status: 200,
    description: 'Список всех групп',
  })
  findAll() {
    return this.groupsService.findAll();
  }

  @Get('statistics')
  @RequirePermission('reports', 'read')
  @ApiOperation({ summary: 'Получить статистику по группам' })
  @ApiResponse({
    status: 200,
    description: 'Статистика по группам',
    type: GroupStatisticsDto,
  })
  getStatistics() {
    return this.groupsService.getGroupStatistics();
  }

  @Get('course/:courseNumber')
  @RequirePermission('groups', 'read')
  @ApiOperation({ summary: 'Получить группы по номеру курса' })
  @ApiParam({
    name: 'courseNumber',
    description: 'Номер курса (1-6)',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Группы указанного курса',
  })
  @ApiResponse({
    status: 400,
    description: 'Неверный номер курса',
  })
  findByCourse(@Param('courseNumber', ParseIntPipe) courseNumber: number) {
    return this.groupsService.findByCourse(courseNumber);
  }

  @Get(':id')
  @RequirePermission('groups', 'read')
  @ApiOperation({ summary: 'Получить группу по ID' })
  @ApiParam({
    name: 'id',
    description: 'ID группы',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Информация о группе',
  })
  @ApiResponse({
    status: 404,
    description: 'Группа не найдена',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.groupsService.findOne(id);
  }

  @Get(':id/schedule')
  @RequirePermission('schedule', 'read')
  @ApiOperation({ summary: 'Получить расписание группы' })
  @ApiParam({
    name: 'id',
    description: 'ID группы',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Расписание группы',
  })
  @ApiResponse({
    status: 404,
    description: 'Группа не найдена',
  })
  getGroupSchedule(@Param('id', ParseIntPipe) id: number) {
    return this.groupsService.getGroupSchedule(id);
  }

  @Get(':id/study-plans')
  @RequirePermission('study-plans', 'read')
  @ApiOperation({ summary: 'Получить учебные планы группы' })
  @ApiParam({
    name: 'id',
    description: 'ID группы',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Учебные планы группы',
  })
  @ApiResponse({
    status: 404,
    description: 'Группа не найдена',
  })
  getGroupStudyPlans(@Param('id', ParseIntPipe) id: number) {
    return this.groupsService.getGroupStudyPlans(id);
  }

  @Patch(':id')
  @RequirePermission('groups', 'update')
  @ApiOperation({ summary: 'Обновить информацию о группе' })
  @ApiParam({
    name: 'id',
    description: 'ID группы',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Группа успешно обновлена',
  })
  @ApiResponse({
    status: 404,
    description: 'Группа не найдена',
  })
  @ApiResponse({
    status: 403,
    description: 'Недостаточно прав для обновления группы',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateGroupDto: UpdateGroupDto,
  ) {
    return this.groupsService.update(id, updateGroupDto);
  }

  @Delete(':id')
  @RequirePermission('groups', 'delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить группу' })
  @ApiParam({
    name: 'id',
    description: 'ID группы',
    example: 1,
  })
  @ApiResponse({
    status: 204,
    description: 'Группа успешно удалена',
  })
  @ApiResponse({
    status: 404,
    description: 'Группа не найдена',
  })
  @ApiResponse({
    status: 403,
    description: 'Недостаточно прав для удаления группы',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.groupsService.remove(id);
  }

  @Post(':groupId/students/:studentId')
  @RequirePermission('groups', 'update')
  @ApiOperation({ summary: 'Добавить студента в группу' })
  @ApiParam({
    name: 'groupId',
    description: 'ID группы',
    example: 1,
  })
  @ApiParam({
    name: 'studentId',
    description: 'ID студента',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Студент успешно добавлен в группу',
  })
  @ApiResponse({
    status: 404,
    description: 'Группа или студент не найдены',
  })
  @ApiResponse({
    status: 403,
    description: 'Недостаточно прав для управления студентами в группах',
  })
  addStudentToGroup(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('studentId', ParseIntPipe) studentId: number,
  ) {
    return this.groupsService.addStudentToGroup(groupId, studentId);
  }

  @Delete('students/:studentId')
  @RequirePermission('groups', 'update')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Исключить студента из группы' })
  @ApiParam({
    name: 'studentId',
    description: 'ID студента',
    example: 1,
  })
  @ApiResponse({
    status: 204,
    description: 'Студент успешно исключен из группы',
  })
  @ApiResponse({
    status: 404,
    description: 'Студент не найден',
  })
  @ApiResponse({
    status: 403,
    description: 'Недостаточно прав для управления студентами в группах',
  })
  removeStudentFromGroup(@Param('studentId', ParseIntPipe) studentId: number) {
    return this.groupsService.removeStudentFromGroup(studentId);
  }
}
