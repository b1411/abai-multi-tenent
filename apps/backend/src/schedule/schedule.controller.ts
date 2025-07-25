import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/role.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('Schedule')
@Controller('schedule')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN', 'TEACHER')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Post()
  @ApiOperation({ summary: 'Создать новое расписание' })
  @ApiResponse({ status: 201, description: 'Расписание успешно создано' })
  @ApiResponse({ status: 400, description: 'Некорректные данные или конфликт расписания' })
  @ApiResponse({ status: 404, description: 'Связанная сущность не найдена' })
  create(@Body() createScheduleDto: CreateScheduleDto) {
    return this.scheduleService.create(createScheduleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Получить все расписания' })
  @ApiResponse({ status: 200, description: 'Список всех расписаний' })
  @Roles('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')
  findAll() {
    return this.scheduleService.findAll();
  }

  @Get('group/:groupId')
  @ApiOperation({ summary: 'Получить расписание группы' })
  @ApiResponse({ status: 200, description: 'Расписание группы' })
  @ApiParam({ name: 'groupId', description: 'ID группы' })
  @Roles('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')
  findByGroup(@Param('groupId') groupId: string) {
    return this.scheduleService.findByGroup(+groupId);
  }

  @Get('teacher/:teacherId')
  @ApiOperation({ summary: 'Получить расписание преподавателя' })
  @ApiResponse({ status: 200, description: 'Расписание преподавателя' })
  @ApiParam({ name: 'teacherId', description: 'ID преподавателя' })
  @Roles('ADMIN', 'TEACHER')
  findByTeacher(@Param('teacherId') teacherId: string) {
    return this.scheduleService.findByTeacher(+teacherId);
  }

  @Get('classroom/:classroomId')
  @ApiOperation({ summary: 'Получить расписание аудитории' })
  @ApiResponse({ status: 200, description: 'Расписание аудитории' })
  @ApiParam({ name: 'classroomId', description: 'ID аудитории' })
  @Roles('ADMIN', 'TEACHER')
  findByClassroom(@Param('classroomId') classroomId: string) {
    return this.scheduleService.findByClassroom(+classroomId);
  }

  @Get('day/:dayOfWeek')
  @ApiOperation({ summary: 'Получить расписание на день недели' })
  @ApiResponse({ status: 200, description: 'Расписание на день' })
  @ApiParam({ 
    name: 'dayOfWeek', 
    description: 'День недели (1-7: понедельник-воскресенье)',
    example: 1
  })
  @Roles('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')
  findByDayOfWeek(@Param('dayOfWeek') dayOfWeek: string) {
    return this.scheduleService.findByDayOfWeek(+dayOfWeek);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить расписание по ID' })
  @ApiResponse({ status: 200, description: 'Данные расписания' })
  @ApiResponse({ status: 404, description: 'Расписание не найдено' })
  @ApiParam({ name: 'id', description: 'UUID расписания' })
  @Roles('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')
  findOne(@Param('id') id: string) {
    return this.scheduleService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить расписание' })
  @ApiResponse({ status: 200, description: 'Расписание успешно обновлено' })
  @ApiResponse({ status: 400, description: 'Некорректные данные или конфликт расписания' })
  @ApiResponse({ status: 404, description: 'Расписание не найдено' })
  @ApiParam({ name: 'id', description: 'UUID расписания' })
  update(@Param('id') id: string, @Body() updateScheduleDto: UpdateScheduleDto) {
    return this.scheduleService.update(id, updateScheduleDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить расписание' })
  @ApiResponse({ status: 200, description: 'Расписание успешно удалено' })
  @ApiResponse({ status: 404, description: 'Расписание не найдено' })
  @ApiParam({ name: 'id', description: 'UUID расписания' })
  remove(@Param('id') id: string) {
    return this.scheduleService.remove(id);
  }
}
