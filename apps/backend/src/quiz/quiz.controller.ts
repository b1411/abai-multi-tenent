import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { QuizService } from './quiz.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/role.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Paginate } from '../common/decorators/paginate.decorator';
import { PaginateQueryDto } from '../common/dtos/paginate.dto';
import { QuizAttemptService } from './quiz-attempt.service';
import { AnswerQuestionDto } from './dto/answer-question.dto';

@ApiTags('Quizzes')
@Controller('quiz')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
export class QuizController {
  constructor(
    private readonly quizService: QuizService,
    private readonly quizAttemptService: QuizAttemptService,
  ) {}

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

  @Get(':id/all-attempts')
  @ApiOperation({ summary: 'Получить все попытки по тесту' })
  @ApiResponse({ status: 200, description: 'Все попытки теста' })
  @ApiParam({ name: 'id', description: 'ID теста' })
  @Roles('TEACHER', 'ADMIN')
  getAllAttemptsByQuiz(@Param('id') id: string) {
    return this.quizService.getAllAttemptsByQuiz(+id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить тест по ID' })
  @ApiResponse({ status: 200, description: 'Информация о тесте' })
  @ApiResponse({ status: 404, description: 'Тест не найден' })
  @ApiParam({ name: 'id', description: 'ID теста' })
  @Roles('TEACHER', 'ADMIN', 'STUDENT')
  findOne(@Param('id') id: string, @Req() req) {
    return this.quizService.findOne(+id, req.user.role);
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

  @Post(':id/start')
  @ApiOperation({ summary: 'Начать прохождение теста' })
  @ApiResponse({ status: 201, description: 'Попытка создана' })
  @ApiParam({ name: 'id', description: 'ID теста' })
  @Roles('STUDENT')
  startAttempt(@Param('id') id: string, @Req() req) {
    return this.quizAttemptService.startAttempt(+id, req.user.id);
  }

  @Post('answer')
  @ApiOperation({ summary: 'Ответить на вопрос теста' })
  @ApiResponse({ status: 201, description: 'Ответ сохранен' })
  @Roles('STUDENT')
  answerQuestion(@Body() answerQuestionDto: AnswerQuestionDto, @Req() req) {
    return this.quizAttemptService.answerQuestion(answerQuestionDto, req.user.id);
  }

  @Post('attempt/:id/finish')
  @ApiOperation({ summary: 'Завершить попытку теста' })
  @ApiResponse({ status: 200, description: 'Попытка завершена, результат посчитан' })
  @ApiParam({ name: 'id', description: 'ID попытки' })
  @Roles('STUDENT')
  finishAttempt(@Param('id') id: string, @Req() req) {
    return this.quizAttemptService.finishAttempt(+id, req.user.id);
  }

  @Get('attempt/:id/result')
  @ApiOperation({ summary: 'Получить результат попытки' })
  @ApiResponse({ status: 200, description: 'Результат попытки' })
  @ApiParam({ name: 'id', description: 'ID попытки' })
  @Roles('STUDENT', 'TEACHER', 'ADMIN')
  getAttemptResult(@Param('id') id: string, @Req() req) {
    return this.quizAttemptService.getAttemptResult(+id, req.user.id);
  }

  @Get('my-attempts')
  @ApiOperation({ summary: 'Получить мои попытки по всем тестам' })
  @ApiResponse({ status: 200, description: 'Мои попытки' })
  @Roles('STUDENT')
  getMyAttempts(@Req() req) {
    return this.quizService.getMyAttempts(req.user.id);
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Получить статус теста для студента' })
  @ApiResponse({ status: 200, description: 'Статус теста' })
  @ApiParam({ name: 'id', description: 'ID теста' })
  @Roles('STUDENT')
  getQuizStatus(@Param('id') id: string, @Req() req) {
    return this.quizService.getQuizStatusForStudent(+id, req.user.id);
  }

  @Get('student-attempt/:studentId/:quizId')
  @ApiOperation({ summary: 'Получить результаты попыток студента по тесту' })
  @ApiResponse({ status: 200, description: 'Результаты попыток' })
  @ApiParam({ name: 'studentId', description: 'ID студента' })
  @ApiParam({ name: 'quizId', description: 'ID теста' })
  @Roles('TEACHER', 'ADMIN')
  getStudentAttemptResult(
    @Param('studentId') studentId: string,
    @Param('quizId') quizId: string,
  ) {
    return this.quizService.getStudentAttemptsByQuiz(+studentId, +quizId);
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
