import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query, 
  UseGuards, 
  Req,
  ParseIntPipe,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { VacationsService } from './vacations.service';
import { CreateVacationDto } from './dto/create-vacation.dto';
import { UpdateVacationDto } from './dto/update-vacation.dto';
import { VacationFilterDto } from './dto/vacation-filter.dto';
import { UpdateVacationStatusDto } from './dto/update-vacation-status.dto';
import { AuthGuard } from '../common/guards/auth.guard';

@ApiTags('vacations')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('vacations')
export class VacationsController {
  constructor(private readonly vacationsService: VacationsService) {}

  @Post()
  @ApiOperation({ summary: 'Создать заявку на отпуск' })
  @ApiResponse({ status: 201, description: 'Заявка успешно создана' })
  @ApiResponse({ status: 400, description: 'Некорректные данные' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  create(@Body() createVacationDto: CreateVacationDto, @Req() req: any) {
    const userId = req.user.id;
    return this.vacationsService.create(createVacationDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Получить список отпусков' })
  @ApiResponse({ status: 200, description: 'Список отпусков успешно получен' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Номер страницы' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Количество записей на странице' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Поиск по имени или отделу' })
  @ApiQuery({ name: 'type', required: false, enum: ['vacation', 'sick-leave', 'maternity-leave', 'unpaid-leave', 'business-trip'] })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'approved', 'rejected', 'completed'] })
  @ApiQuery({ name: 'period', required: false, type: String, description: 'Период (current-year, next-year, previous-year)' })
  findAll(@Query() filterDto: VacationFilterDto & { page?: string; limit?: string }, @Req() req: any) {
    const page = filterDto.page ? parseInt(filterDto.page) : 1;
    const limit = filterDto.limit ? parseInt(filterDto.limit) : 10;
    const userId = req.user.id;
    return this.vacationsService.findAll({ ...filterDto, page, limit }, userId);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Получить статистику по отпускам' })
  @ApiResponse({ status: 200, description: 'Статистика успешно получена' })
  getSummary(@Req() req: any) {
    return this.vacationsService.getVacationsSummary(req.user.id);
  }

  @Get('substitutions')
  @ApiOperation({ summary: 'Получить список замен' })
  @ApiResponse({ status: 200, description: 'Список замен успешно получен' })
  @ApiQuery({ name: 'date', required: false, type: String, description: 'Дата для проверки замен' })
  @ApiQuery({ name: 'department', required: false, type: String, description: 'Отдел' })
  @ApiQuery({ name: 'substituteId', required: false, type: String, description: 'ID замещающего преподавателя' })
  getSubstitutions(
    @Query('date') date?: string,
    @Query('department') department?: string,
    @Query('substituteId') substituteId?: string
  ) {
    return this.vacationsService.getSubstitutions(date, department, substituteId);
  }

  @Get('teacher/:teacherId/summary')
  @ApiOperation({ summary: 'Получить сводку по отпускам преподавателя' })
  @ApiResponse({ status: 200, description: 'Сводка успешно получена' })
  @ApiResponse({ status: 404, description: 'Преподаватель не найден' })
  getTeacherSummary(@Param('teacherId', ParseIntPipe) teacherId: number) {
    return this.vacationsService.getTeacherVacationSummary(teacherId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить отпуск по ID' })
  @ApiResponse({ status: 200, description: 'Отпуск успешно найден' })
  @ApiResponse({ status: 404, description: 'Отпуск не найден' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.vacationsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить заявку на отпуск' })
  @ApiResponse({ status: 200, description: 'Заявка успешно обновлена' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав' })
  @ApiResponse({ status: 404, description: 'Отпуск не найден' })
  update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateVacationDto: UpdateVacationDto,
    @Req() req: any
  ) {
    return this.vacationsService.update(id, updateVacationDto, req.user.id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Обновить статус отпуска' })
  @ApiResponse({ status: 200, description: 'Статус успешно обновлен' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав' })
  @ApiResponse({ status: 404, description: 'Отпуск не найден' })
  updateStatus(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateStatusDto: UpdateVacationStatusDto,
    @Req() req: any
  ) {
    return this.vacationsService.updateStatus(id, updateStatusDto, req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить заявку на отпуск' })
  @ApiResponse({ status: 204, description: 'Заявка успешно удалена' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав' })
  @ApiResponse({ status: 404, description: 'Отпуск не найден' })
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.vacationsService.remove(id, req.user.id);
  }

  @Get('teacher/:teacherId/lessons')
  @ApiOperation({ summary: 'Получить уроки преподавателя для замещения' })
  @ApiResponse({ status: 200, description: 'Список уроков успешно получен' })
  @ApiResponse({ status: 404, description: 'Преподаватель не найден' })
  getTeacherLessons(@Param('teacherId', ParseIntPipe) teacherId: number) {
    return this.vacationsService.getTeacherLessons(teacherId);
  }
}
