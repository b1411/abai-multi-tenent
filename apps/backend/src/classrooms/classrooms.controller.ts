import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ClassroomsService } from './classrooms.service';
import { CreateClassroomDto } from './dto/create-classroom.dto';
import { UpdateClassroomDto } from './dto/update-classroom.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { PermissionGuard, RequirePermission } from '../common/guards/permission.guard';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';

@ApiTags('Classrooms')
@Controller('classrooms')
@ApiBearerAuth()
@UseGuards(AuthGuard, PermissionGuard)
export class ClassroomsController {
  constructor(private readonly classroomsService: ClassroomsService) { }

  @Post()
  @RequirePermission('classrooms', 'create')
  @ApiOperation({ summary: 'Создать новую аудиторию' })
  @ApiResponse({ status: 201, description: 'Аудитория успешно создана' })
  @ApiResponse({ status: 400, description: 'Некорректные данные' })
  create(@Body() createClassroomDto: CreateClassroomDto) {
    return this.classroomsService.create(createClassroomDto);
  }

  @Get()
  @RequirePermission('classrooms', 'read')
  @ApiOperation({ summary: 'Получить все аудитории' })
  @ApiResponse({ status: 200, description: 'Список всех аудиторий' })
  findAll() {
    return this.classroomsService.findAll();
  }

  @Get('building/:building')
  @RequirePermission('classrooms', 'read')
  @ApiOperation({ summary: 'Получить аудитории по зданию' })
  @ApiResponse({ status: 200, description: 'Аудитории в указанном здании' })
  @ApiParam({ name: 'building', description: 'Название здания' })
  findByBuilding(@Param('building') building: string) {
    return this.classroomsService.findByBuilding(building);
  }

  @Get('type/:type')
  @RequirePermission('classrooms', 'read')
  @ApiOperation({ summary: 'Получить аудитории по типу' })
  @ApiResponse({ status: 200, description: 'Аудитории указанного типа' })
  @ApiParam({
    name: 'type',
    description: 'Тип аудитории',
    enum: ['LECTURE', 'PRACTICE', 'COMPUTER', 'LABORATORY', 'OTHER']
  })
  findByType(@Param('type') type: string) {
    return this.classroomsService.findByType(type);
  }

  @Get('capacity/:minCapacity')
  @RequirePermission('classrooms', 'read')
  @ApiOperation({ summary: 'Найти аудитории по вместимости' })
  @ApiResponse({ status: 200, description: 'Аудитории с подходящей вместимостью' })
  @ApiParam({ name: 'minCapacity', description: 'Минимальная вместимость' })
  @ApiQuery({ name: 'maxCapacity', description: 'Максимальная вместимость', required: false })
  findByCapacity(
    @Param('minCapacity') minCapacity: string,
    @Query('maxCapacity') maxCapacity?: string,
  ) {
    return this.classroomsService.findByCapacity(
      +minCapacity,
      maxCapacity ? +maxCapacity : undefined,
    );
  }

  @Get('available/:dayOfWeek/:startTime/:endTime')
  @RequirePermission('classrooms', 'read')
  @ApiOperation({ summary: 'Найти свободные аудитории на указанное время' })
  @ApiResponse({ status: 200, description: 'Список свободных аудиторий' })
  @ApiParam({ name: 'dayOfWeek', description: 'День недели (1-7)' })
  @ApiParam({ name: 'startTime', description: 'Время начала (HH:MM)' })
  @ApiParam({ name: 'endTime', description: 'Время окончания (HH:MM)' })
  findAvailableClassrooms(
    @Param('dayOfWeek') dayOfWeek: string,
    @Param('startTime') startTime: string,
    @Param('endTime') endTime: string,
  ) {
    return this.classroomsService.findAvailableClassrooms(+dayOfWeek, startTime, endTime);
  }

  @Post('by-equipment')
  @RequirePermission('classrooms', 'read')
  @ApiOperation({ summary: 'Найти аудитории по оборудованию' })
  @ApiResponse({ status: 200, description: 'Аудитории с указанным оборудованием' })
  findByEquipment(@Body() body: { equipment: string[] }) {
    return this.classroomsService.findByEquipment(body.equipment);
  }

  @Get('statistics')
  @RequirePermission('classrooms', 'read')
  @ApiOperation({ summary: 'Получить статистику по аудиториям' })
  @ApiResponse({ status: 200, description: 'Статистика аудиторий' })
  getStatistics() {
    return this.classroomsService.getClassroomStatistics();
  }

  @Get(':id')
  @RequirePermission('classrooms', 'read')
  @ApiOperation({ summary: 'Получить аудиторию по ID' })
  @ApiResponse({ status: 200, description: 'Данные аудитории с расписанием' })
  @ApiResponse({ status: 404, description: 'Аудитория не найдена' })
  @ApiParam({ name: 'id', description: 'ID аудитории' })
  findOne(@Param('id') id: string) {
    return this.classroomsService.findOne(+id);
  }

  @Patch(':id')
  @RequirePermission('classrooms', 'update')
  @ApiOperation({ summary: 'Обновить аудиторию' })
  @ApiResponse({ status: 200, description: 'Аудитория успешно обновлена' })
  @ApiResponse({ status: 404, description: 'Аудитория не найдена' })
  @ApiParam({ name: 'id', description: 'ID аудитории' })
  update(@Param('id') id: string, @Body() updateClassroomDto: UpdateClassroomDto) {
    return this.classroomsService.update(+id, updateClassroomDto);
  }

  @Delete(':id')
  @RequirePermission('classrooms', 'delete')
  @ApiOperation({ summary: 'Удалить аудиторию' })
  @ApiResponse({ status: 200, description: 'Аудитория успешно удалена' })
  @ApiResponse({ status: 404, description: 'Аудитория не найдена' })
  @ApiParam({ name: 'id', description: 'ID аудитории' })
  remove(@Param('id') id: string) {
    return this.classroomsService.remove(+id);
  }
}
