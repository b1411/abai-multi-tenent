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
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupStatisticsDto } from './dto/group-statistics.dto';
import { RolesGuard } from '../common/guards/role.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from 'generated/prisma';
import { AuthGuard } from '../common/guards/auth.guard';

@ApiTags('Groups')
@Controller('groups')
@UseGuards(AuthGuard, RolesGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) { }

  @Get('test')
  @ApiOperation({ summary: 'Тестовый endpoint без авторизации' })
  test() {
    return { message: 'Groups API works!', timestamp: new Date().toISOString() };
  }

  @Post()

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
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.TEACHER)
  create(@Body() createGroupDto: CreateGroupDto) {
    return this.groupsService.create(createGroupDto);
  }

  @Get()

  @ApiOperation({ summary: 'Получить все группы' })
  @ApiResponse({
    status: 200,
    description: 'Список всех групп',
  })
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT)
  findAll(@Req() req: any) {
    // Для родителей возвращаем только группы их детей
    if (req.user.role === 'PARENT') {
      return this.groupsService.findParentGroups(req.user.id);
    }
    // Для всех остальных возвращаем все группы
    return this.groupsService.findAll();
  }

  @Get('statistics')

  @ApiOperation({ summary: 'Получить статистику по группам' })
  @ApiResponse({
    status: 200,
    description: 'Статистика по группам',
    type: GroupStatisticsDto,
  })
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.TEACHER, UserRole.PARENT)
  getStatistics(@Req() req: any) {
    // Для родителей возвращаем статистику только по группам их детей
    if (req.user.role === 'PARENT') {
      return this.groupsService.getParentGroupStatistics(req.user.id);
    }
    // Для всех остальных возвращаем общую статистику
    return this.groupsService.getGroupStatistics();
  }

  @Get('course/:courseNumber')
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
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT)
  findByCourse(@Param('courseNumber', ParseIntPipe) courseNumber: number) {
    return this.groupsService.findByCourse(courseNumber);
  }

  @Get(':id')
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
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.groupsService.findOne(id);
  }

  @Get(':id/schedule')
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
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT)
  getGroupSchedule(@Param('id', ParseIntPipe) id: number) {
    return this.groupsService.getGroupSchedule(id);
  }

  @Get(':id/study-plans')
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
  @Roles(UserRole.ADMIN, UserRole.HR, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT)
  getGroupStudyPlans(@Param('id', ParseIntPipe) id: number) {
    return this.groupsService.getGroupStudyPlans(id);
  }

  @Patch(':id')
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
  @Roles(UserRole.ADMIN, UserRole.HR)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateGroupDto: UpdateGroupDto,
  ) {
    return this.groupsService.update(id, updateGroupDto);
  }

  @Delete(':id')
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
  @Roles(UserRole.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.groupsService.remove(id);
  }

  @Post(':groupId/students/:studentId')
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
  @Roles(UserRole.ADMIN, UserRole.HR)
  addStudentToGroup(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('studentId', ParseIntPipe) studentId: number,
  ) {
    return this.groupsService.addStudentToGroup(groupId, studentId);
  }

  @Delete('students/:studentId')
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
  @Roles(UserRole.ADMIN, UserRole.HR)
  removeStudentFromGroup(@Param('studentId', ParseIntPipe) studentId: number) {
    return this.groupsService.removeStudentFromGroup(studentId);
  }
}
