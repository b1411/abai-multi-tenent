import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request, ParseIntPipe } from '@nestjs/common';
import { ClassroomsService } from './classrooms.service';
import { CreateClassroomDto } from './dto/create-classroom.dto';
import { UpdateClassroomDto } from './dto/update-classroom.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/role.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CreateClassroomBookingDto, UpdateClassroomBookingStatusDto } from './dto/create-classroom-booking.dto';
import { ModifyClassroomDocumentDto } from './dto/modify-classroom-document.dto';

@ApiTags('Classrooms')
@Controller('classrooms')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'HR')
export class ClassroomsController {
  constructor(private readonly classroomsService: ClassroomsService) { }

  @Post()
  @ApiOperation({ summary: 'Создать новую аудиторию' })
  @ApiResponse({ status: 201, description: 'Аудитория успешно создана' })
  @ApiResponse({ status: 400, description: 'Некорректные данные' })
  @Roles('ADMIN')
  create(@Body() createClassroomDto: CreateClassroomDto) {
    return this.classroomsService.create(createClassroomDto);
  }

  @Get()
  @ApiOperation({ summary: 'Получить все аудитории' })
  @ApiResponse({ status: 200, description: 'Список всех аудиторий' })
  @Roles('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')
  findAll() {
    return this.classroomsService.findAll();
  }

  @Get('building/:building')
  @ApiOperation({ summary: 'Получить аудитории по зданию' })
  @ApiResponse({ status: 200, description: 'Аудитории в указанном здании' })
  @ApiParam({ name: 'building', description: 'Название здания' })
  @Roles('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')
  findByBuilding(@Param('building') building: string) {
    return this.classroomsService.findByBuilding(building);
  }

  @Get('type/:type')
  @ApiOperation({ summary: 'Получить аудитории по типу' })
  @ApiResponse({ status: 200, description: 'Аудитории указанного типа' })
  @ApiParam({
    name: 'type',
    description: 'Тип аудитории',
    enum: ['LECTURE', 'PRACTICE', 'COMPUTER', 'LABORATORY', 'OTHER']
  })
  @Roles('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')
  findByType(@Param('type') type: string) {
    return this.classroomsService.findByType(type);
  }

  @Get('capacity/:minCapacity')
  @ApiOperation({ summary: 'Найти аудитории по вместимости' })
  @ApiResponse({ status: 200, description: 'Аудитории с подходящей вместимостью' })
  @ApiParam({ name: 'minCapacity', description: 'Минимальная вместимость' })
  @ApiQuery({ name: 'maxCapacity', description: 'Максимальная вместимость', required: false })
  @Roles('ADMIN', 'TEACHER')
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
  @ApiOperation({ summary: 'Найти свободные аудитории на указанное время' })
  @ApiResponse({ status: 200, description: 'Список свободных аудиторий' })
  @ApiParam({ name: 'dayOfWeek', description: 'День недели (1-7)' })
  @ApiParam({ name: 'startTime', description: 'Время начала (HH:MM)' })
  @ApiParam({ name: 'endTime', description: 'Время окончания (HH:MM)' })
  @Roles('ADMIN', 'TEACHER')
  findAvailableClassrooms(
    @Param('dayOfWeek') dayOfWeek: string,
    @Param('startTime') startTime: string,
    @Param('endTime') endTime: string,
  ) {
    return this.classroomsService.findAvailableClassrooms(+dayOfWeek, startTime, endTime);
  }

  @Post('by-equipment')
  @ApiOperation({ summary: 'Найти аудитории по оборудованию' })
  @ApiResponse({ status: 200, description: 'Аудитории с указанным оборудованием' })
  @Roles('ADMIN', 'TEACHER')
  findByEquipment(@Body() body: { equipment: string[] }) {
    return this.classroomsService.findByEquipment(body.equipment);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Получить статистику по аудиториям' })
  @ApiResponse({ status: 200, description: 'Статистика аудиторий' })
  @Roles('ADMIN')
  getStatistics() {
    return this.classroomsService.getClassroomStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить аудиторию по ID' })
  @ApiResponse({ status: 200, description: 'Данные аудитории с расписанием' })
  @ApiResponse({ status: 404, description: 'Аудитория не найдена' })
  @ApiParam({ name: 'id', description: 'ID аудитории' })
  @Roles('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')
  findOne(@Param('id') id: string) {
    return this.classroomsService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить аудиторию' })
  @ApiResponse({ status: 200, description: 'Аудитория успешно обновлена' })
  @ApiResponse({ status: 404, description: 'Аудитория не найдена' })
  @ApiParam({ name: 'id', description: 'ID аудитории' })
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() updateClassroomDto: UpdateClassroomDto) {
    return this.classroomsService.update(+id, updateClassroomDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить аудиторию' })
  @ApiResponse({ status: 200, description: 'Аудитория успешно удалена' })
  @ApiResponse({ status: 404, description: 'Аудитория не найдена' })
  @ApiParam({ name: 'id', description: 'ID аудитории' })
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.classroomsService.remove(+id);
  }

  // ----- Bookings -----

  @Post(':id/bookings')
  @ApiOperation({ summary: 'Создать бронирование аудитории' })
  @ApiResponse({ status: 201, description: 'Заявка создана (PENDING)' })
  @Roles('ADMIN', 'TEACHER', 'STUDENT')
  createBooking(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateClassroomBookingDto,
    @Request() req,
  ) {
    // classroomId в dto можно не доверять - форсируем из параметра
    return this.classroomsService.createBooking({ ...dto, classroomId: id }, req.user.id);
  }

  @Get(':id/bookings')
  @ApiOperation({ summary: 'Список бронирований аудитории' })
  @ApiQuery({ name: 'date', required: false, description: 'Фильтр по дате (YYYY-MM-DD)' })
  @Roles('ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'HR')
  listBookings(
    @Param('id', ParseIntPipe) id: number,
    @Query('date') date?: string,
  ) {
    return this.classroomsService.listBookings(id, date);
  }

  @Patch('bookings/:bookingId/status')
  @ApiOperation({ summary: 'Изменить статус бронирования' })
  @Roles('ADMIN')
  updateBookingStatus(
    @Param('bookingId') bookingId: string,
    @Body() dto: UpdateClassroomBookingStatusDto,
  ) {
    return this.classroomsService.updateBookingStatus(bookingId, dto.status);
  }

  // ----- Documents attach/detach -----

  @Post(':id/documents')
  @ApiOperation({ summary: 'Прикрепить документ к аудитории' })
  @Roles('ADMIN', 'TEACHER')
  attachDocument(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ModifyClassroomDocumentDto,
  ) {
    return this.classroomsService.attachDocument(id, dto.fileId);
  }

  @Delete(':id/documents/:fileId')
  @ApiOperation({ summary: 'Удалить документ из аудитории' })
  @Roles('ADMIN', 'TEACHER')
  detachDocument(
    @Param('id', ParseIntPipe) id: number,
    @Param('fileId', ParseIntPipe) fileId: number,
  ) {
    return this.classroomsService.detachDocument(id, fileId);
  }
}
