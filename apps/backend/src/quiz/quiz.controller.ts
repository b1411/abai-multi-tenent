import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { QuizService } from './quiz.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { CreateQuizSubmissionDto } from './dto/create-quiz-submission.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { PermissionGuard, RequirePermission } from '../common/guards/permission.guard';
import { RolesGuard } from '../common/guards/role.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Paginate } from '../common/decorators/paginate.decorator';
import { PaginateQueryDto } from '../common/dtos/paginate.dto';

@ApiTags('Quizzes')
@Controller('quiz')
@ApiBearerAuth()
@UseGuards(AuthGuard, PermissionGuard)
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Post()
  @RequirePermission('quiz', 'create')
  @ApiOperation({ summary: 'Создать новый тест' })
  @ApiResponse({ status: 201, description: 'Тест успешно создан' })
  @ApiResponse({ status: 400, description: 'Некорректные данные' })
  create(@Body() createQuizDto: CreateQuizDto) {
    return this.quizService.create(createQuizDto);
  }

  @Get()
  @RequirePermission('quiz', 'read')
  @ApiOperation({ summary: 'Получить все тесты с пагинацией' })
  @ApiResponse({ status: 200, description: 'Список тестов' })
  findAll(@Paginate() paginateQuery: PaginateQueryDto) {
    return this.quizService.findAll(paginateQuery);
  }

  @Get('active')
  @RequirePermission('quiz', 'read')
  @ApiOperation({ summary: 'Получить активные тесты' })
  @ApiResponse({ status: 200, description: 'Список активных тестов' })
  findActive() {
    return this.quizService.findActive();
  }

  @Get('my-submissions')
  @RequirePermission('quiz', 'read', { scope: 'OWN' })
  @ApiOperation({ summary: 'Получить мои результаты тестов (для студентов)' })
  @ApiResponse({ status: 200, description: 'Результаты студента' })
  getMySubmissions(@Query('studentId') studentId: string) {
    return this.quizService.getStudentSubmissions(+studentId);
  }

  @Get(':id')
  @RequirePermission('quiz', 'read')
  @ApiOperation({ summary: 'Получить тест по ID' })
  @ApiResponse({ status: 200, description: 'Информация о тесте' })
  @ApiResponse({ status: 404, description: 'Тест не найден' })
  @ApiParam({ name: 'id', description: 'ID теста' })
  findOne(@Param('id') id: string) {
    return this.quizService.findOne(+id);
  }

  @Get(':id/questions')
  @RequirePermission('quiz', 'read')
  @ApiOperation({ summary: 'Получить вопросы теста' })
  @ApiResponse({ status: 200, description: 'Список вопросов теста' })
  @ApiParam({ name: 'id', description: 'ID теста' })
  getQuestions(@Param('id') id: string) {
    return this.quizService.getQuestions(+id);
  }

  @Post(':id/questions')
  @RequirePermission('quiz', 'update')
  @ApiOperation({ summary: 'Добавить вопрос к тесту' })
  @ApiResponse({ status: 201, description: 'Вопрос добавлен' })
  @ApiParam({ name: 'id', description: 'ID теста' })
  addQuestion(@Param('id') id: string, @Body() createQuestionDto: CreateQuestionDto) {
    return this.quizService.addQuestion(+id, createQuestionDto);
  }

  @Get(':id/submissions')
  @RequirePermission('quiz', 'read')
  @ApiOperation({ summary: 'Получить все результаты теста' })
  @ApiResponse({ status: 200, description: 'Результаты теста' })
  @ApiParam({ name: 'id', description: 'ID теста' })
  getSubmissions(@Param('id') id: string) {
    return this.quizService.getQuizSubmissions(+id);
  }

  @Post(':id/submit')
  @RequirePermission('quiz', 'create', { scope: 'OWN' })
  @ApiOperation({ summary: 'Отправить ответы на тест' })
  @ApiResponse({ status: 201, description: 'Ответы отправлены' })
  @ApiResponse({ status: 400, description: 'Некорректные данные или тест неактивен' })
  @ApiParam({ name: 'id', description: 'ID теста' })
  submitQuiz(@Param('id') id: string, @Body() submissionDto: CreateQuizSubmissionDto) {
    return this.quizService.submitQuiz(+id, submissionDto);
  }

  @Get(':id/statistics')
  @RequirePermission('quiz', 'read')
  @ApiOperation({ summary: 'Получить статистику по тесту' })
  @ApiResponse({ status: 200, description: 'Статистика теста' })
  @ApiParam({ name: 'id', description: 'ID теста' })
  getStatistics(@Param('id') id: string) {
    return this.quizService.getQuizStatistics(+id);
  }

  @Patch(':id')
  @RequirePermission('quiz', 'update')
  @ApiOperation({ summary: 'Обновить тест' })
  @ApiResponse({ status: 200, description: 'Тест обновлен' })
  @ApiResponse({ status: 404, description: 'Тест не найден' })
  @ApiParam({ name: 'id', description: 'ID теста' })
  update(@Param('id') id: string, @Body() updateQuizDto: UpdateQuizDto) {
    return this.quizService.update(+id, updateQuizDto);
  }

  @Patch(':id/activate')
  @RequirePermission('quiz', 'update')
  @ApiOperation({ summary: 'Активировать/деактивировать тест' })
  @ApiResponse({ status: 200, description: 'Статус теста изменен' })
  @ApiParam({ name: 'id', description: 'ID теста' })
  toggleActive(@Param('id') id: string, @Body() body: { isActive: boolean }) {
    return this.quizService.toggleActive(+id, body.isActive);
  }

  @Delete(':id')
  @RequirePermission('quiz', 'delete')
  @ApiOperation({ summary: 'Удалить тест' })
  @ApiResponse({ status: 200, description: 'Тест удален' })
  @ApiResponse({ status: 404, description: 'Тест не найден' })
  @ApiParam({ name: 'id', description: 'ID теста' })
  remove(@Param('id') id: string) {
    return this.quizService.remove(+id);
  }

  @Delete('questions/:questionId')
  @RequirePermission('quiz', 'delete')
  @ApiOperation({ summary: 'Удалить вопрос' })
  @ApiResponse({ status: 200, description: 'Вопрос удален' })
  @ApiParam({ name: 'questionId', description: 'ID вопроса' })
  removeQuestion(@Param('questionId') questionId: string) {
    return this.quizService.removeQuestion(+questionId);
  }
}
