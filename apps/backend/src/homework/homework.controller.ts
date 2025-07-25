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
  ParseIntPipe,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { HomeworkService } from './homework.service';
import { 
  CreateHomeworkDto, 
  HomeworkSubmitDto, 
  GradeHomeworkDto, 
  HomeworkQueryDto 
} from './dto/create-homework.dto';
import { UpdateHomeworkDto } from './dto/update-homework.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../../generated/prisma';

@ApiTags('homework')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('homework')
export class HomeworkController {
  constructor(private readonly homeworkService: HomeworkService) { }

  @Post()
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Создать домашнее задание' })
  @ApiResponse({ status: 201, description: 'Домашнее задание создано' })
  create(@Body() createHomeworkDto: CreateHomeworkDto) {
    return this.homeworkService.create(createHomeworkDto);
  }

  @Get()
  @ApiOperation({ summary: 'Получить список домашних заданий' })
  @ApiResponse({ status: 200, description: 'Список домашних заданий' })
  @ApiQuery({ name: 'search', required: false, description: 'Поиск по названию' })
  @ApiQuery({ name: 'lessonId', required: false, description: 'ID урока' })
  @ApiQuery({ name: 'studentId', required: false, description: 'ID студента' })
  @ApiQuery({ name: 'teacherId', required: false, description: 'ID преподавателя' })
  @ApiQuery({ name: 'page', required: false, description: 'Номер страницы' })
  @ApiQuery({ name: 'limit', required: false, description: 'Количество элементов на странице' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Поле для сортировки' })
  @ApiQuery({ name: 'order', required: false, description: 'Направление сортировки' })
  findAll(@Query() filters: HomeworkQueryDto) {
    return this.homeworkService.findAll(filters);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Получить статистику домашних заданий' })
  @ApiResponse({ status: 200, description: 'Статистика домашних заданий' })
  @ApiQuery({ name: 'lessonId', required: false, description: 'ID урока' })
  @ApiQuery({ name: 'studentId', required: false, description: 'ID студента' })
  @ApiQuery({ name: 'teacherId', required: false, description: 'ID преподавателя' })
  getStats(
    @Query('lessonId') lessonId?: string,
    @Query('studentId') studentId?: string,
    @Query('teacherId') teacherId?: string,
  ) {
    const filters = {
      lessonId: lessonId ? parseInt(lessonId) : undefined,
      studentId: studentId ? parseInt(studentId) : undefined,
      teacherId: teacherId ? parseInt(teacherId) : undefined,
    };
    return this.homeworkService.getHomeworkStats(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить домашнее задание по ID' })
  @ApiResponse({ status: 200, description: 'Домашнее задание найдено' })
  @ApiResponse({ status: 404, description: 'Домашнее задание не найдено' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.homeworkService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Обновить домашнее задание' })
  @ApiResponse({ status: 200, description: 'Домашнее задание обновлено' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateHomeworkDto: UpdateHomeworkDto) {
    return this.homeworkService.update(id, updateHomeworkDto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Удалить домашнее задание' })
  @ApiResponse({ status: 200, description: 'Домашнее задание удалено' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.homeworkService.remove(id);
  }

  @Post(':id/submit')
  @Roles('STUDENT')
  @ApiOperation({ summary: 'Отправить выполненное домашнее задание' })
  @ApiResponse({ status: 201, description: 'Домашнее задание отправлено' })
  @ApiResponse({ status: 400, description: 'Ошибка при отправке' })
  submitHomework(
    @Param('id', ParseIntPipe) id: number,
    @Body() submitDto: HomeworkSubmitDto,
    @CurrentUser('studentId') studentId: number
  ) {
    return this.homeworkService.submitHomework(id, studentId, submitDto);
  }

  @Get(':id/submissions')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Получить отправки домашнего задания' })
  @ApiResponse({ status: 200, description: 'Список отправок' })
  getSubmissions(@Param('id', ParseIntPipe) id: number) {
    return this.homeworkService.getHomeworkSubmissions(id);
  }

  @Patch('submissions/:submissionId/grade')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Оценить домашнее задание' })
  @ApiResponse({ status: 200, description: 'Домашнее задание оценено' })
  @ApiResponse({ status: 403, description: 'Нет прав для оценки' })
  gradeHomework(
    @Param('submissionId', ParseIntPipe) submissionId: number,
    @Body() gradeDto: GradeHomeworkDto,
    @CurrentUser('teacherId') teacherId: number
  ) {
    return this.homeworkService.gradeHomework(submissionId, gradeDto, teacherId);
  }
}

// Дополнительный контроллер для роутов уроков
@ApiTags('lessons')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('lessons')
export class LessonHomeworkController {
  constructor(private readonly homeworkService: HomeworkService) { }

  @Get(':lessonId/homework')
  @ApiOperation({ summary: 'Получить домашние задания урока' })
  @ApiResponse({ status: 200, description: 'Список домашних заданий урока' })
  getHomeworksByLesson(@Param('lessonId', ParseIntPipe) lessonId: number) {
    return this.homeworkService.getHomeworksByLesson(lessonId);
  }
}
