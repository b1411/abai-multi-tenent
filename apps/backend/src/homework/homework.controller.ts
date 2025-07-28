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
  HttpStatus,
  UseInterceptors,
  UploadedFiles,
  Req
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { HomeworkService } from './homework.service';
import { 
  CreateHomeworkDto, 
  HomeworkSubmitDto, 
  GradeHomeworkDto, 
  HomeworkQueryDto 
} from './dto/create-homework.dto';
import { UpdateHomeworkDto } from './dto/update-homework.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { PermissionGuard, RequirePermission } from '../common/guards/permission.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../../generated/prisma';

@ApiTags('homework')
@ApiBearerAuth()
@UseGuards(AuthGuard, PermissionGuard)
@Controller('homework')
export class HomeworkController {
  constructor(private readonly homeworkService: HomeworkService) { }

  @Post()
  @RequirePermission('homework', 'create')
  @ApiOperation({ summary: 'Создать домашнее задание' })
  @ApiResponse({ status: 201, description: 'Домашнее задание создано' })
  create(@Body() createHomeworkDto: CreateHomeworkDto) {
    return this.homeworkService.create(createHomeworkDto);
  }

  @Get()
  @RequirePermission('homework', 'read')
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

  @Get('me')
  @RequirePermission('homework', 'read', { scope: 'OWN' })
  @ApiOperation({ summary: 'Получить домашние задания текущего студента' })
  @ApiResponse({ status: 200, description: 'Список домашних заданий студента' })
  @ApiQuery({ name: 'search', required: false, description: 'Поиск по названию' })
  @ApiQuery({ name: 'lessonId', required: false, description: 'ID урока' })
  @ApiQuery({ name: 'page', required: false, description: 'Номер страницы' })
  @ApiQuery({ name: 'limit', required: false, description: 'Количество элементов на странице' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Поле для сортировки' })
  @ApiQuery({ name: 'order', required: false, description: 'Направление сортировки' })
  findMyHomework(@Query() filters: HomeworkQueryDto, @Req() req: any) {
    return this.homeworkService.findStudentHomework(filters, req.user.id);
  }

  @Get('stats')
  @RequirePermission('reports', 'read')
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
  @RequirePermission('homework', 'read', { scope: 'ASSIGNED' })
  @ApiOperation({ summary: 'Получить домашнее задание по ID' })
  @ApiResponse({ status: 200, description: 'Домашнее задание найдено' })
  @ApiResponse({ status: 404, description: 'Домашнее задание не найдено' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.homeworkService.findOne(id);
  }

  @Patch(':id')
  @RequirePermission('homework', 'update')
  @ApiOperation({ summary: 'Обновить домашнее задание' })
  @ApiResponse({ status: 200, description: 'Домашнее задание обновлено' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateHomeworkDto: UpdateHomeworkDto) {
    return this.homeworkService.update(id, updateHomeworkDto);
  }

  @Delete(':id')
  @RequirePermission('homework', 'delete')
  @ApiOperation({ summary: 'Удалить домашнее задание' })
  @ApiResponse({ status: 200, description: 'Домашнее задание удалено' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.homeworkService.remove(id);
  }

  @Post(':id/submit')
  @RequirePermission('homework', 'create', { scope: 'OWN' })
  @ApiOperation({ summary: 'Отправить выполненное домашнее задание' })
  @ApiResponse({ status: 201, description: 'Домашнее задание отправлено' })
  @ApiResponse({ status: 400, description: 'Ошибка при отправке' })
  submitHomework(
    @Param('id', ParseIntPipe) id: number,
    @Body() submitDto: HomeworkSubmitDto,
    @Req() req: any
  ) {
    return this.homeworkService.submitHomework(id, req.user.id, submitDto);
  }

  @Patch(':id/update-submission')
  @RequirePermission('homework', 'update', { scope: 'OWN' })
  @ApiOperation({ summary: 'Обновить отправленное домашнее задание' })
  @ApiResponse({ status: 200, description: 'Домашнее задание обновлено' })
  @ApiResponse({ status: 400, description: 'Ошибка при обновлении' })
  updateHomeworkSubmission(
    @Param('id', ParseIntPipe) id: number,
    @Body() submitDto: HomeworkSubmitDto,
    @Req() req: any
  ) {
    return this.homeworkService.updateHomeworkSubmission(id, req.user.id, submitDto);
  }

  @Get(':id/submissions')
  @RequirePermission('homework', 'read')
  @ApiOperation({ summary: 'Получить отправки домашнего задания' })
  @ApiResponse({ status: 200, description: 'Список отправок' })
  getSubmissions(@Param('id', ParseIntPipe) id: number) {
    return this.homeworkService.getHomeworkSubmissions(id);
  }

  @Patch('submissions/:submissionId/grade')
  @RequirePermission('homework', 'update')
  @ApiOperation({ summary: 'Оценить домашнее задание' })
  @ApiResponse({ status: 200, description: 'Домашнее задание оценено' })
  @ApiResponse({ status: 403, description: 'Нет прав для оценки' })
  gradeHomework(
    @Param('submissionId', ParseIntPipe) submissionId: number,
    @Body() gradeDto: GradeHomeworkDto,
    @Req() req: any
  ) {
    const teacherId = req.user.teacher?.id || 0;
    const userRole = req.user.role;
    return this.homeworkService.gradeHomework(submissionId, gradeDto, teacherId, userRole);
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
