import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { QuizService } from './quiz.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { CreateQuizSubmissionDto } from './dto/create-quiz-submission.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/role.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Paginate } from '../common/decorators/paginate.decorator';
import { PaginateQueryDto } from '../common/dtos/paginate.dto';

@ApiTags('Quizzes')
@Controller('quiz')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Post()
  @ApiOperation({ summary: 'Создать новый тест' })
  @ApiResponse({ status: 201, description: 'Тест успешно создан' })
  @ApiResponse({ status: 400, description: 'Некорректные данные' })
  @Roles('TEACHER', 'ADMIN')
  create(@Body() createQuizDto: CreateQuizDto) {
    return this.quizService.create(createQuizDto);
  }

  @Get()
  @ApiOperation({ summary: 'Получить все тесты с пагинацией' })
  @ApiResponse({ status: 200, description: 'Список тестов' })
  @Roles('TEACHER', 'ADMIN', 'STUDENT')
  findAll(@Paginate() paginateQuery: PaginateQueryDto) {
    return this.quizService.findAll(paginateQuery);
  }

  @Get('active')
  @ApiOperation({ summary: 'Получить активные тесты' })
  @ApiResponse({ status: 200, description: 'Список активных тестов' })
  @Roles('STUDENT', 'TEACHER', 'ADMIN')
  findActive() {
    return this.quizService.findActive();
  }

  @Get('my-submissions')
  @ApiOperation({ summary: 'Получить мои результаты тестов (для студентов)' })
  @ApiResponse({ status: 200, description: 'Результаты студента' })
  @Roles('STUDENT')
  getMySubmissions(@Query('studentId') studentId: string) {
    return this.quizService.getStudentSubmissions(+studentId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить тест по ID' })
  @ApiResponse({ status: 200, description: 'Информация о тесте' })
  @ApiResponse({ status: 404, description: 'Тест не найден' })
  @ApiParam({ name: 'id', description: 'ID теста' })
  @Roles('TEACHER', 'ADMIN', 'STUDENT')
  findOne(@Param('id') id: string) {
    return this.quizService.findOne(+id);
  }

  @Get(':id/questions')
  @ApiOperation({ summary: 'Получить вопросы теста' })
  @ApiResponse({ status: 200, description: 'Список вопросов теста' })
  @ApiParam({ name: 'id', description: 'ID теста' })
  @Roles('TEACHER', 'ADMIN', 'STUDENT')
  getQuestions(@Param('id') id: string) {
    return this.quizService.getQuestions(+id);
  }

  @Post(':id/questions')
  @ApiOperation({ summary: 'Добавить вопрос к тесту' })
  @ApiResponse({ status: 201, description: 'Вопрос добавлен' })
  @ApiParam({ name: 'id', description: 'ID теста' })
  @Roles('TEACHER', 'ADMIN')
  addQuestion(@Param('id') id: string, @Body() createQuestionDto: CreateQuestionDto) {
    return this.quizService.addQuestion(+id, createQuestionDto);
  }

  @Get(':id/submissions')
  @ApiOperation({ summary: 'Получить все результаты теста' })
  @ApiResponse({ status: 200, description: 'Результаты теста' })
  @ApiParam({ name: 'id', description: 'ID теста' })
  @Roles('TEACHER', 'ADMIN')
  getSubmissions(@Param('id') id: string) {
    return this.quizService.getQuizSubmissions(+id);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Отправить ответы на тест' })
  @ApiResponse({ status: 201, description: 'Ответы отправлены' })
  @ApiResponse({ status: 400, description: 'Некорректные данные или тест неактивен' })
  @ApiParam({ name: 'id', description: 'ID теста' })
  @Roles('STUDENT')
  submitQuiz(@Param('id') id: string, @Body() submissionDto: CreateQuizSubmissionDto) {
    return this.quizService.submitQuiz(+id, submissionDto);
  }

  @Get(':id/statistics')
  @ApiOperation({ summary: 'Получить статистику по тесту' })
  @ApiResponse({ status: 200, description: 'Статистика теста' })
  @ApiParam({ name: 'id', description: 'ID теста' })
  @Roles('TEACHER', 'ADMIN')
  getStatistics(@Param('id') id: string) {
    return this.quizService.getQuizStatistics(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить тест' })
  @ApiResponse({ status: 200, description: 'Тест обновлен' })
  @ApiResponse({ status: 404, description: 'Тест не найден' })
  @ApiParam({ name: 'id', description: 'ID теста' })
  @Roles('TEACHER', 'ADMIN')
  update(@Param('id') id: string, @Body() updateQuizDto: UpdateQuizDto) {
    return this.quizService.update(+id, updateQuizDto);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Активировать/деактивировать тест' })
  @ApiResponse({ status: 200, description: 'Статус теста изменен' })
  @ApiParam({ name: 'id', description: 'ID теста' })
  @Roles('TEACHER', 'ADMIN')
  toggleActive(@Param('id') id: string, @Body() body: { isActive: boolean }) {
    return this.quizService.toggleActive(+id, body.isActive);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить тест' })
  @ApiResponse({ status: 200, description: 'Тест удален' })
  @ApiResponse({ status: 404, description: 'Тест не найден' })
  @ApiParam({ name: 'id', description: 'ID теста' })
  @Roles('TEACHER', 'ADMIN')
  remove(@Param('id') id: string) {
    return this.quizService.remove(+id);
  }

  @Delete('questions/:questionId')
  @ApiOperation({ summary: 'Удалить вопрос' })
  @ApiResponse({ status: 200, description: 'Вопрос удален' })
  @ApiParam({ name: 'questionId', description: 'ID вопроса' })
  @Roles('TEACHER', 'ADMIN')
  removeQuestion(@Param('questionId') questionId: string) {
    return this.quizService.removeQuestion(+questionId);
  }
}
