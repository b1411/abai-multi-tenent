import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/role.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('Groups')
@Controller('groups')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN', 'TEACHER')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @ApiOperation({ summary: 'Создать новую группу' })
  @ApiResponse({ status: 201, description: 'Группа успешно создана' })
  @ApiResponse({ status: 400, description: 'Некорректные данные' })
  @Roles('ADMIN')
  create(@Body() createGroupDto: CreateGroupDto) {
    return this.groupsService.create(createGroupDto);
  }

  @Get()
  @ApiOperation({ summary: 'Получить все группы' })
  @ApiResponse({ status: 200, description: 'Список всех групп с количеством студентов' })
  @Roles('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')
  findAll() {
    return this.groupsService.findAll();
  }

  @Get('course/:courseNumber')
  @ApiOperation({ summary: 'Получить группы по номеру курса' })
  @ApiResponse({ status: 200, description: 'Группы указанного курса' })
  @ApiParam({ name: 'courseNumber', description: 'Номер курса' })
  @Roles('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')
  findByCourse(@Param('courseNumber') courseNumber: string) {
    return this.groupsService.findByCourse(+courseNumber);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Получить статистику по группам' })
  @ApiResponse({ status: 200, description: 'Статистика групп и студентов' })
  @Roles('ADMIN', 'TEACHER')
  getStatistics() {
    return this.groupsService.getGroupStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить группу по ID' })
  @ApiResponse({ status: 200, description: 'Полная информация о группе' })
  @ApiResponse({ status: 404, description: 'Группа не найдена' })
  @ApiParam({ name: 'id', description: 'ID группы' })
  @Roles('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')
  findOne(@Param('id') id: string) {
    return this.groupsService.findOne(+id);
  }

  @Get(':id/schedule')
  @ApiOperation({ summary: 'Получить расписание группы' })
  @ApiResponse({ status: 200, description: 'Расписание группы' })
  @ApiResponse({ status: 404, description: 'Группа не найдена' })
  @ApiParam({ name: 'id', description: 'ID группы' })
  @Roles('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')
  getGroupSchedule(@Param('id') id: string) {
    return this.groupsService.getGroupSchedule(+id);
  }

  @Get(':id/study-plans')
  @ApiOperation({ summary: 'Получить учебные планы группы' })
  @ApiResponse({ status: 200, description: 'Учебные планы группы' })
  @ApiResponse({ status: 404, description: 'Группа не найдена' })
  @ApiParam({ name: 'id', description: 'ID группы' })
  @Roles('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')
  getGroupStudyPlans(@Param('id') id: string) {
    return this.groupsService.getGroupStudyPlans(+id);
  }

  @Post(':groupId/students/:studentId')
  @ApiOperation({ summary: 'Добавить студента в группу' })
  @ApiResponse({ status: 200, description: 'Студент успешно добавлен в группу' })
  @ApiResponse({ status: 404, description: 'Группа или студент не найден' })
  @ApiParam({ name: 'groupId', description: 'ID группы' })
  @ApiParam({ name: 'studentId', description: 'ID студента' })
  @Roles('ADMIN')
  addStudentToGroup(
    @Param('groupId') groupId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.groupsService.addStudentToGroup(+groupId, +studentId);
  }

  @Delete('students/:studentId')
  @ApiOperation({ summary: 'Исключить студента из группы' })
  @ApiResponse({ status: 200, description: 'Студент исключен из группы' })
  @ApiResponse({ status: 404, description: 'Студент не найден' })
  @ApiParam({ name: 'studentId', description: 'ID студента' })
  @Roles('ADMIN')
  removeStudentFromGroup(@Param('studentId') studentId: string) {
    return this.groupsService.removeStudentFromGroup(+studentId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить группу' })
  @ApiResponse({ status: 200, description: 'Группа успешно обновлена' })
  @ApiResponse({ status: 404, description: 'Группа не найдена' })
  @ApiParam({ name: 'id', description: 'ID группы' })
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() updateGroupDto: UpdateGroupDto) {
    return this.groupsService.update(+id, updateGroupDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить группу' })
  @ApiResponse({ status: 200, description: 'Группа успешно удалена' })
  @ApiResponse({ status: 404, description: 'Группа не найдена' })
  @ApiParam({ name: 'id', description: 'ID группы' })
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.groupsService.remove(+id);
  }
}
