import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Req } from '@nestjs/common';
import { LessonResultsService } from './lesson-results.service';
import { CreateLessonResultDto } from './dto/create-lesson-result.dto';
import { UpdateLessonResultDto } from './dto/update-lesson-result.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/role.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';

@ApiTags('Electronic Journal')
@Controller('lesson-results')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
export class LessonResultsController {
  constructor(private readonly lessonResultsService: LessonResultsService) {}

  @Post()
  @ApiOperation({ summary: 'Выставить оценку или отметить посещаемость' })
  @ApiResponse({ status: 201, description: 'Результат урока успешно создан' })
  @ApiResponse({ status: 400, description: 'Некорректные данные' })
  @ApiResponse({ status: 409, description: 'Результат для этого студента и урока уже существует' })
  @Roles('ADMIN', 'TEACHER')
  create(@Body() createLessonResultDto: CreateLessonResultDto) {
    return this.lessonResultsService.create(createLessonResultDto);
  }

  @Get()
  @ApiOperation({ summary: 'Получить все результаты уроков' })
  @ApiResponse({ status: 200, description: 'Список всех результатов уроков' })
  @Roles('ADMIN', 'TEACHER')
  findAll() {
    return this.lessonResultsService.findAll();
  }

  @Get('lesson/:lessonId/journal')
  @ApiOperation({ summary: 'Получить журнал по уроку (все студенты и их оценки)' })
  @ApiResponse({ status: 200, description: 'Журнал урока со всеми студентами' })
  @ApiResponse({ status: 404, description: 'Урок не найден' })
  @ApiParam({ name: 'lessonId', description: 'ID урока' })
  @Roles('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')
  getJournalByLesson(@Param('lessonId') lessonId: string) {
    return this.lessonResultsService.getJournalByLesson(+lessonId);
  }

  @Get('student/:studentId/subject/:studyPlanId/grades')
  @ApiOperation({ summary: 'Получить все оценки студента по предмету' })
  @ApiResponse({ status: 200, description: 'Оценки студента по предмету со статистикой' })
  @ApiResponse({ status: 404, description: 'Студент или предмет не найден' })
  @ApiParam({ name: 'studentId', description: 'ID студента' })
  @ApiParam({ name: 'studyPlanId', description: 'ID учебного плана (предмета)' })
  @Roles('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')
  getStudentGradesBySubject(
    @Param('studentId') studentId: string,
    @Param('studyPlanId') studyPlanId: string,
  ) {
    return this.lessonResultsService.getStudentGradesBySubject(+studentId, +studyPlanId);
  }

  @Get('group/:groupId/journal')
  @ApiOperation({ summary: 'Получить журнал группы за период' })
  @ApiResponse({ status: 200, description: 'Журнал группы за указанный период' })
  @ApiResponse({ status: 404, description: 'Группа не найдена' })
  @ApiParam({ name: 'groupId', description: 'ID группы' })
  @ApiQuery({ name: 'startDate', description: 'Дата начала периода (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', description: 'Дата окончания периода (YYYY-MM-DD)' })
  @Roles('ADMIN', 'TEACHER', 'STUDENT')
  getGroupJournalByPeriod(
    @Param('groupId') groupId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.lessonResultsService.getGroupJournalByPeriod(
      +groupId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Post('lesson/:lessonId/bulk-attendance')
  @ApiOperation({ summary: 'Массово отметить посещаемость урока' })
  @ApiResponse({ status: 201, description: 'Посещаемость успешно отмечена' })
  @ApiResponse({ status: 404, description: 'Урок не найден' })
  @ApiParam({ name: 'lessonId', description: 'ID урока' })
  @ApiBody({
    description: 'Данные о посещаемости студентов',
    schema: {
      type: 'object',
      properties: {
        attendanceData: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              studentId: { type: 'number', description: 'ID студента' },
              attendance: { type: 'boolean', description: 'Присутствовал ли студент' },
              absentReason: { type: 'string', enum: ['SICK', 'FAMILY', 'OTHER'], description: 'Причина отсутствия' },
              absentComment: { type: 'string', description: 'Комментарий к отсутствию' },
            },
            required: ['studentId', 'attendance'],
          },
        },
      },
      required: ['attendanceData'],
    },
  })
  @Roles('ADMIN', 'TEACHER')
  bulkMarkAttendance(
    @Param('lessonId') lessonId: string,
    @Body() body: { 
      attendanceData: { 
        studentId: number; 
        attendance: boolean; 
        absentReason?: 'SICK' | 'FAMILY' | 'OTHER'; 
        absentComment?: string 
      }[] 
    },
  ) {
    return this.lessonResultsService.bulkMarkAttendance(+lessonId, body.attendanceData);
  }

  @Get('attendance/statistics')
  @ApiOperation({ summary: 'Получить статистику посещаемости' })
  @ApiResponse({ status: 200, description: 'Статистика посещаемости' })
  @ApiQuery({ name: 'groupId', description: 'ID группы (опционально)', required: false })
  @ApiQuery({ name: 'studyPlanId', description: 'ID учебного плана (опционально)', required: false })
  @ApiQuery({ name: 'startDate', description: 'Дата начала периода (YYYY-MM-DD, опционально)', required: false })
  @ApiQuery({ name: 'endDate', description: 'Дата окончания периода (YYYY-MM-DD, опционально)', required: false })
  @Roles('ADMIN', 'TEACHER')
  getAttendanceStatistics(
    @Query('groupId') groupId?: string,
    @Query('studyPlanId') studyPlanId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.lessonResultsService.getAttendanceStatistics(
      groupId ? +groupId : undefined,
      studyPlanId ? +studyPlanId : undefined,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('my-grades')
  @ApiOperation({ summary: 'Получить свои оценки (для студентов)' })
  @ApiResponse({ status: 200, description: 'Личные оценки студента со статистикой' })
  @ApiQuery({ name: 'studyPlanId', description: 'ID учебного плана (опционально)', required: false })
  @ApiQuery({ name: 'startDate', description: 'Дата начала периода (YYYY-MM-DD, опционально)', required: false })
  @ApiQuery({ name: 'endDate', description: 'Дата окончания периода (YYYY-MM-DD, опционально)', required: false })
  @Roles('STUDENT')
  getMyGrades(
    @Req() req: any,
    @Query('studyPlanId') studyPlanId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.lessonResultsService.getMyGrades(req.user.id, {
      studyPlanId: studyPlanId ? +studyPlanId : undefined,
      startDate,
      endDate,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить результат урока по ID' })
  @ApiResponse({ status: 200, description: 'Подробная информация о результате урока' })
  @ApiResponse({ status: 404, description: 'Результат урока не найден' })
  @ApiParam({ name: 'id', description: 'ID результата урока' })
  @Roles('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')
  findOne(@Param('id') id: string) {
    return this.lessonResultsService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить результат урока (изменить оценку или посещаемость)' })
  @ApiResponse({ status: 200, description: 'Результат урока успешно обновлен' })
  @ApiResponse({ status: 404, description: 'Результат урока не найден' })
  @ApiParam({ name: 'id', description: 'ID результата урока' })
  @Roles('ADMIN', 'TEACHER')
  update(@Param('id') id: string, @Body() updateLessonResultDto: UpdateLessonResultDto) {
    return this.lessonResultsService.update(+id, updateLessonResultDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить результат урока' })
  @ApiResponse({ status: 200, description: 'Результат урока успешно удален' })
  @ApiResponse({ status: 404, description: 'Результат урока не найден' })
  @ApiParam({ name: 'id', description: 'ID результата урока' })
  @Roles('ADMIN', 'TEACHER')
  remove(@Param('id') id: string) {
    return this.lessonResultsService.remove(+id);
  }
}
