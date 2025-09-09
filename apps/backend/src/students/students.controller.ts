import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { CreateFullStudentDto } from './dto/create-full-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { CreateRemarkDto } from './dto/create-remark.dto';
import { UpdateRemarkDto } from './dto/update-remark.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CreatePdpPlanDto } from './dto/create-pdp-plan.dto';
import { UpdatePdpPlanDto } from './dto/update-pdp-plan.dto';
import { CreatePdpGoalDto } from './dto/create-pdp-goal.dto';
import { UpdatePdpGoalDto } from './dto/update-pdp-goal.dto';
import { CreateExtraEducationDto } from './dto/create-extra-education.dto';
import { UpdateExtraEducationDto } from './dto/update-extra-education.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/role.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('Students')
@Controller('students')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) { }

  @Post()
  @ApiOperation({
    summary: 'Зачислить пользователя как студента',
    description: `
Создает запись студента, связывая пользователя с ролью STUDENT с группой.

**Требования:**
- Пользователь должен существовать и иметь роль STUDENT
- Группа должна существовать
- Пользователь не должен быть уже зачислен как студент
    `
  })
  @ApiResponse({ status: 201, description: 'Студент успешно зачислен' })
  @ApiResponse({ status: 400, description: 'Некорректные данные' })
  @ApiResponse({ status: 404, description: 'Пользователь или группа не найдены' })
  @ApiResponse({ status: 409, description: 'Пользователь уже является студентом' })
  @Roles('ADMIN', 'HR', 'TEACHER')
  create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.create(createStudentDto);
  }

  @Post('create-full')
  @ApiOperation({
    summary: 'Создать нового студента (пользователь + студент)',
    description: `
Создает нового пользователя с ролью STUDENT и сразу зачисляет его как студента в группу.

**Требования:**
- Email должен быть уникальным
- Группа должна существовать
- Только админы и учителя могут создавать студентов
    `
  })
  @ApiResponse({ status: 201, description: 'Студент успешно создан и зачислен' })
  @ApiResponse({ status: 400, description: 'Некорректные данные' })
  @ApiResponse({ status: 404, description: 'Группа не найдена' })
  @ApiResponse({ status: 409, description: 'Пользователь с таким email уже существует' })
  @Roles('ADMIN', 'HR', 'TEACHER')
  createFullStudent(@Body() createFullStudentDto: CreateFullStudentDto, @Request() req) {
    return this.studentsService.createFullStudent(createFullStudentDto, req.user?.role);
  }

  @Get()
  @ApiOperation({ summary: 'Получить всех студентов' })
  @ApiResponse({ status: 200, description: 'Список всех студентов с информацией о пользователях и группах' })
  @Roles('ADMIN', 'HR', 'TEACHER', 'STUDENT', 'PARENT')
  findAll(@Request() req) {
    if (req.user?.role === 'TEACHER') {
      return this.studentsService.findStudentsForTeacher(req.user.id);
    }
    return this.studentsService.findAll();
  }

  @Get('paginated')
  @ApiOperation({ summary: 'Получить студентов постранично' })
  @ApiResponse({ status: 200, description: 'Пагинированный список студентов' })
  @Roles('ADMIN', 'HR', 'TEACHER', 'STUDENT', 'PARENT')
  getPaginated(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('search') search?: string,
    @Query('groupId') groupId?: string,
  ) {
    return this.studentsService.findPaginated({
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      search: search || undefined,
      groupId: groupId ? Number(groupId) : undefined,
      role: req.user?.role,
      teacherUserId: req.user?.id,
    });
  }

  @Get('group/:groupId')
  @ApiOperation({ summary: 'Получить студентов группы' })
  @ApiResponse({ status: 200, description: 'Список студентов указанной группы' })
  @ApiResponse({ status: 404, description: 'Группа не найдена' })
  @ApiParam({ name: 'groupId', description: 'ID группы' })
  @Roles('ADMIN', 'HR', 'TEACHER', 'STUDENT', 'PARENT')
  findByGroup(@Param('groupId') groupId: string) {
    return this.studentsService.findByGroup(+groupId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Получить запись студента по ID пользователя' })
  @ApiResponse({ status: 200, description: 'Информация о студенте' })
  @ApiResponse({ status: 404, description: 'Студент не найден' })
  @ApiParam({ name: 'userId', description: 'ID пользователя' })
  @Roles('ADMIN', 'HR', 'TEACHER', 'STUDENT', 'PARENT')
  findByUser(@Param('userId') userId: string) {
    return this.studentsService.findByUser(+userId);
  }

  @Get(':id/grades')
  @ApiOperation({ summary: 'Получить все оценки студента по предметам' })
  @ApiResponse({ status: 200, description: 'Оценки студента сгруппированные по предметам со статистикой' })
  @ApiResponse({ status: 404, description: 'Студент не найден' })
  @ApiParam({ name: 'id', description: 'ID студента' })
  @Roles('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')
  getStudentGrades(@Param('id') id: string) {
    return this.studentsService.getStudentGrades(+id);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Получить статистику студентов' })
  @ApiResponse({ status: 200, description: 'Статистика студентов по группам' })
  @Roles('ADMIN', 'HR', 'TEACHER')
  getStatistics() {
    return this.studentsService.getStudentStatistics();
  }

  @Get('count/active')
  @ApiOperation({ summary: 'Получить количество активных студентов' })
  @ApiResponse({ status: 200, description: 'Количество активных студентов' })
  @Roles('ADMIN', 'HR', 'TEACHER', 'FINANCIST')
  getActiveStudentsCount() {
    return this.studentsService.getActiveStudentsCount();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить студента по ID' })
  @ApiResponse({ status: 200, description: 'Полная информация о студенте' })
  @ApiResponse({ status: 404, description: 'Студент не найден' })
  @ApiParam({ name: 'id', description: 'ID студента' })
  @Roles('ADMIN', 'HR', 'TEACHER', 'STUDENT', 'PARENT')
  findOne(@Param('id') id: string) {
    return this.studentsService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить данные студента' })
  @ApiResponse({ status: 200, description: 'Данные студента успешно обновлены' })
  @ApiResponse({ status: 404, description: 'Студент не найден' })
  @ApiParam({ name: 'id', description: 'ID студента' })
  @Roles('ADMIN', 'HR')
  update(@Param('id') id: string, @Body() updateStudentDto: UpdateStudentDto) {
    return this.studentsService.update(+id, updateStudentDto);
  }

  @Patch(':id/change-group/:newGroupId')
  @ApiOperation({ summary: 'Перевести студента в другую группу' })
  @ApiResponse({ status: 200, description: 'Студент успешно переведен в новую группу' })
  @ApiResponse({ status: 404, description: 'Студент или группа не найдены' })
  @ApiParam({ name: 'id', description: 'ID студента' })
  @ApiParam({ name: 'newGroupId', description: 'ID новой группы' })
  @Roles('ADMIN', 'HR')
  changeGroup(@Param('id') id: string, @Param('newGroupId') newGroupId: string) {
    return this.studentsService.changeStudentGroup(+id, +newGroupId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Отчислить студента' })
  @ApiResponse({ status: 200, description: 'Студент успешно отчислен' })
  @ApiResponse({ status: 404, description: 'Студент не найден' })
  @ApiParam({ name: 'id', description: 'ID студента' })
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.studentsService.remove(+id);
  }

  // === МЕТОДЫ ДЛЯ РАБОТЫ С РОДИТЕЛЯМИ ===

  @Post(':id/parents/:parentId')
  @ApiOperation({ summary: 'Привязать родителя к студенту' })
  @ApiResponse({ status: 201, description: 'Родитель успешно привязан к студенту' })
  @ApiResponse({ status: 404, description: 'Студент или родитель не найден' })
  @ApiResponse({ status: 409, description: 'Родитель уже привязан к этому студенту' })
  @ApiParam({ name: 'id', description: 'ID студента' })
  @ApiParam({ name: 'parentId', description: 'ID родителя' })
  @Roles('ADMIN', 'HR')
  addParentToStudent(@Param('id') id: string, @Param('parentId') parentId: string) {
    return this.studentsService.addParentToStudent(+id, +parentId);
  }

  @Delete(':id/parents/:parentId')
  @ApiOperation({ summary: 'Отвязать родителя от студента' })
  @ApiResponse({ status: 200, description: 'Родитель успешно отвязан от студента' })
  @ApiResponse({ status: 404, description: 'Студент, родитель не найден или связь не существует' })
  @ApiParam({ name: 'id', description: 'ID студента' })
  @ApiParam({ name: 'parentId', description: 'ID родителя' })
  @Roles('ADMIN', 'HR')
  removeParentFromStudent(@Param('id') id: string, @Param('parentId') parentId: string) {
    return this.studentsService.removeParentFromStudent(+id, +parentId);
  }

  @Get(':id/parents')
  @ApiOperation({ summary: 'Получить всех родителей студента' })
  @ApiResponse({ status: 200, description: 'Список родителей студента' })
  @ApiResponse({ status: 404, description: 'Студент не найден' })
  @ApiParam({ name: 'id', description: 'ID студента' })
  @Roles('ADMIN', 'HR', 'TEACHER', 'STUDENT', 'PARENT')
  getStudentParents(@Param('id') id: string) {
    return this.studentsService.getStudentParents(+id);
  }

  // === НОВЫЕ МЕТОДЫ ДЛЯ ПОСЕЩАЕМОСТИ, ФИНАНСОВ И ЭМОЦИОНАЛЬНОГО АНАЛИЗА ===

  @Get(':id/attendance')
  @ApiOperation({
    summary: 'Получить данные о посещаемости студента',
    description: 'Получает полную статистику посещаемости студента с возможностью фильтрации по датам'
  })
  @ApiResponse({ status: 200, description: 'Статистика посещаемости студента' })
  @ApiResponse({ status: 404, description: 'Студент не найден' })
  @ApiParam({ name: 'id', description: 'ID студента' })
  @Roles('ADMIN', 'HR', 'TEACHER', 'STUDENT', 'PARENT')
  getStudentAttendance(
    @Param('id') id: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string
  ) {
    return this.studentsService.getStudentAttendance(+id, dateFrom, dateTo);
  }

  @Get(':id/finances')
  @ApiOperation({
    summary: 'Получить финансовую информацию студента',
    description: `
Получает полную финансовую информацию студента включая платежи, задолженности и статистику.

**Доступ ограничен:**
- Родители: только для своих детей
- Учителя: для всех студентов
- Админы и финансисты: для всех студентов
    `
  })
  @ApiResponse({ status: 200, description: 'Финансовая информация студента' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав доступа' })
  @ApiResponse({ status: 404, description: 'Студент не найден' })
  @ApiParam({ name: 'id', description: 'ID студента' })
  @Roles('ADMIN', 'TEACHER', 'PARENT', 'FINANCIST')
  getStudentFinances(@Param('id') id: string, @Request() req) {
    return this.studentsService.getStudentFinances(+id, req.user?.role, req.user?.id);
  }

  @Get(':id/emotional-state')
  @ApiOperation({
    summary: 'Получить эмоциональное состояние студента',
    description: `
Получает данные об эмоциональном состоянии студента на основе feedback форм и отдельных записей.

**Доступ ограничен:**
- Родители: только для своих детей
- Учителя: для всех студентов
- Админы: для всех студентов
    `
  })
  @ApiResponse({ status: 200, description: 'Эмоциональное состояние студента с трендами и рекомендациями' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав доступа' })
  @ApiResponse({ status: 404, description: 'Студент не найден' })
  @ApiParam({ name: 'id', description: 'ID студента' })
  @Roles('ADMIN', 'TEACHER', 'PARENT')
  getStudentEmotionalState(@Param('id') id: string, @Request() req) {
    return this.studentsService.getStudentEmotionalState(+id, req.user?.role, req.user?.id);
  }

  @Get(':id/complete-report')
  @ApiOperation({
    summary: 'Получить полный отчет по студенту',
    description: `
Получает комплексный отчет включающий:
- Базовую информацию (всем ролям)
- Посещаемость (всем ролям)  
- Оценки (всем ролям)
- Финансы (только родителям, учителям, админам, финансистам)
- Эмоциональное состояние (только родителям, учителям, админам)

Доступ к разным разделам автоматически контролируется в зависимости от роли пользователя.
    `
  })
  @ApiResponse({ status: 200, description: 'Полный отчет по студенту с учетом прав доступа' })
  @ApiResponse({ status: 404, description: 'Студент не найден' })
  @ApiParam({ name: 'id', description: 'ID студента' })
  @Roles('ADMIN', 'HR', 'TEACHER', 'STUDENT', 'PARENT', 'FINANCIST')
  getStudentCompleteReport(@Param('id') id: string, @Request() req) {
    return this.studentsService.getStudentCompleteReport(+id, req.user?.role, req.user?.id);
  }

  // === МЕТОДЫ ДЛЯ РАБОТЫ С ЗАМЕЧАНИЯМИ ===

  @Get(':id/remarks')
  @ApiOperation({
    summary: 'Получить замечания студента',
    description: 'Получает все замечания о студенте. Студенты могут видеть только свои замечания.'
  })
  @ApiResponse({ status: 200, description: 'Список замечаний студента' })
  @ApiResponse({ status: 404, description: 'Студент не найден' })
  @ApiParam({ name: 'id', description: 'ID студента' })
  @Roles('ADMIN', 'TEACHER', 'STUDENT')
  getStudentRemarks(@Param('id') id: string, @Request() req) {
    return this.studentsService.getStudentRemarks(+id, req.user?.role, req.user?.id);
  }

  @Post(':id/remarks')
  @ApiOperation({
    summary: 'Добавить замечание студенту',
    description: 'Добавляет новое замечание о студенте. Доступно только преподавателям и админам.'
  })
  @ApiResponse({ status: 201, description: 'Замечание успешно добавлено' })
  @ApiResponse({ status: 404, description: 'Студент не найден' })
  @ApiParam({ name: 'id', description: 'ID студента' })
  @Roles('ADMIN', 'TEACHER')
  addStudentRemark(@Param('id') id: string, @Body() createRemarkDto: CreateRemarkDto, @Request() req) {
    return this.studentsService.addStudentRemark(+id, createRemarkDto, req.user?.id);
  }

  @Patch('remarks/:remarkId')
  @ApiOperation({
    summary: 'Обновить замечание',
    description: 'Обновляет существующее замечание. Доступно только автору замечания или админам.'
  })
  @ApiResponse({ status: 200, description: 'Замечание успешно обновлено' })
  @ApiResponse({ status: 404, description: 'Замечание не найдено' })
  @ApiParam({ name: 'remarkId', description: 'ID замечания' })
  @Roles('ADMIN', 'TEACHER')
  updateStudentRemark(@Param('remarkId') remarkId: string, @Body() updateRemarkDto: UpdateRemarkDto, @Request() req) {
    return this.studentsService.updateStudentRemark(+remarkId, updateRemarkDto, req.user?.id, req.user?.role);
  }

  @Delete('remarks/:remarkId')
  @ApiOperation({
    summary: 'Удалить замечание',
    description: 'Удаляет замечание. Доступно только автору замечания или админам.'
  })
  @ApiResponse({ status: 200, description: 'Замечание успешно удалено' })
  @ApiResponse({ status: 404, description: 'Замечание не найдено' })
  @ApiParam({ name: 'remarkId', description: 'ID замечания' })
  @Roles('ADMIN', 'TEACHER')
  deleteStudentRemark(@Param('remarkId') remarkId: string, @Request() req) {
    return this.studentsService.deleteStudentRemark(+remarkId, req.user?.id, req.user?.role);
  }

  // === МЕТОДЫ ДЛЯ РАБОТЫ С КОММЕНТАРИЯМИ ===

  @Get(':id/comments')
  @ApiOperation({
    summary: 'Получить комментарии студента',
    description: 'Получает все комментарии о студенте, которые видны только администрации. Доступно только админам.'
  })
  @ApiResponse({ status: 200, description: 'Список комментариев студента' })
  @ApiResponse({ status: 404, description: 'Студент не найден' })
  @ApiParam({ name: 'id', description: 'ID студента' })
  @Roles('ADMIN', 'TEACHER')
  getStudentComments(@Param('id') id: string) {
    return this.studentsService.getStudentComments(+id);
  }

  @Post(':id/comments')
  @ApiOperation({
    summary: 'Добавить комментарий студенту',
    description: 'Добавляет новый комментарий о студенте, который виден только администрации. Доступно только админам.'
  })
  @ApiResponse({ status: 201, description: 'Комментарий успешно добавлен' })
  @ApiResponse({ status: 404, description: 'Студент не найден' })
  @ApiParam({ name: 'id', description: 'ID студента' })
  @Roles('ADMIN')
  addStudentComment(@Param('id') id: string, @Body() createCommentDto: CreateCommentDto, @Request() req) {
    return this.studentsService.addStudentComment(+id, createCommentDto, req.user?.id);
  }

  @Patch('comments/:commentId')
  @ApiOperation({
    summary: 'Обновить комментарий',
    description: 'Обновляет существующий комментарий. Доступно только автору комментария или админам.'
  })
  @ApiResponse({ status: 200, description: 'Комментарий успешно обновлен' })
  @ApiResponse({ status: 404, description: 'Комментарий не найден' })
  @ApiParam({ name: 'commentId', description: 'ID комментария' })
  @Roles('ADMIN')
  updateStudentComment(@Param('commentId') commentId: string, @Body() updateCommentDto: UpdateCommentDto, @Request() req) {
    return this.studentsService.updateStudentComment(+commentId, updateCommentDto, req.user?.id, req.user?.role);
  }

  @Delete('comments/:commentId')
  @ApiOperation({
    summary: 'Удалить комментарий',
    description: 'Удаляет комментарий. Доступно только автору комментария или админам.'
  })
  @ApiResponse({ status: 200, description: 'Комментарий успешно удален' })
  @ApiResponse({ status: 404, description: 'Комментарий не найден' })
  @ApiParam({ name: 'commentId', description: 'ID комментария' })
  @Roles('ADMIN')
  deleteStudentComment(@Param('commentId') commentId: string, @Request() req) {
    return this.studentsService.deleteStudentComment(+commentId, req.user?.id, req.user?.role);
  }

  // === ДОПОЛНИТЕЛЬНОЕ ОБРАЗОВАНИЕ ===
  @Get(':id/extra-education')
  @ApiOperation({ summary: 'Получить доп. образование студента' })
  @ApiResponse({ status: 200, description: 'Список доп. активностей студента' })
  @ApiParam({ name: 'id', description: 'ID студента' })
  @Roles('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')
  getStudentExtraEducation(@Param('id') id: string, @Request() req) {
    return this.studentsService.getStudentExtraEducation(+id, req.user?.role, req.user?.id);
  }

  @Post(':id/extra-education')
  @ApiOperation({ summary: 'Создать запись доп. образования для студента' })
  @ApiResponse({ status: 201, description: 'Активность создана' })
  @ApiParam({ name: 'id', description: 'ID студента' })
  @Roles('ADMIN', 'TEACHER')
  createStudentExtraEducation(@Param('id') id: string, @Body() dto: CreateExtraEducationDto, @Request() req) {
    return this.studentsService.createStudentExtraEducation(+id, dto, req.user?.id, req.user?.role);
  }

  @Patch('extra-education/:activityId')
  @ApiOperation({ summary: 'Обновить запись доп. образования' })
  @ApiResponse({ status: 200, description: 'Активность обновлена' })
  @ApiParam({ name: 'activityId', description: 'ID активности' })
  @Roles('ADMIN', 'TEACHER')
  updateStudentExtraEducation(@Param('activityId') activityId: string, @Body() dto: UpdateExtraEducationDto, @Request() req) {
    return this.studentsService.updateStudentExtraEducation(activityId, dto, req.user?.id, req.user?.role);
  }

  @Delete('extra-education/:activityId')
  @ApiOperation({ summary: 'Удалить запись доп. образования (мягкое удаление)' })
  @ApiResponse({ status: 200, description: 'Активность удалена' })
  @ApiParam({ name: 'activityId', description: 'ID активности' })
  @Roles('ADMIN', 'TEACHER')
  deleteStudentExtraEducation(@Param('activityId') activityId: string, @Request() req) {
    return this.studentsService.deleteStudentExtraEducation(activityId, req.user?.id, req.user?.role);
  }

  // === МЕТОДЫ ДЛЯ ПОЛУЧЕНИЯ ПРЕПОДАВАТЕЛЕЙ СТУДЕНТА ===

  @Get(':id/teachers')
  @ApiOperation({
    summary: 'Получить преподавателей студента',
    description: 'Получает список всех преподавателей, которые ведут занятия у данного студента'
  })
  @ApiResponse({ status: 200, description: 'Список преподавателей студента с предметами' })
  @ApiResponse({ status: 404, description: 'Студент не найден' })
  @ApiParam({ name: 'id', description: 'ID студента' })
  @Roles('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')
  getStudentTeachers(@Param('id') id: string) {
    return this.studentsService.getStudentTeachers(+id);
  }

  @Get(':id/exams')
  @ApiOperation({
    summary: 'Получить контрольные / экзамены студента',
    description: `
Возвращает список уроков типа CONTROL_WORK (по умолчанию) или EXAM для всех учебных планов группы студента.
Поддерживает пагинацию.
Поля result включают персональные результаты студента, если они существуют.`
  })
  @ApiResponse({ status: 200, description: 'Список контрольных / экзаменов студента' })
  @ApiResponse({ status: 404, description: 'Студент не найден' })
  @ApiParam({ name: 'id', description: 'ID студента' })
  @Roles('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')
  getStudentExams(
    @Param('id') id: string,
    @Query('type') type?: 'CONTROL_WORK' | 'EXAM',
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
    @Query('schoolYear') schoolYear?: string,
    @Query('quarter') quarter?: string,
    @Query('month') month?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.studentsService.getStudentExams(+id, {
      type,
      page: Number(page) || 1,
      limit: Number(limit) || 50,
      schoolYear: schoolYear || undefined,
      quarter: quarter ? Number(quarter) : undefined,
      month: month ? Number(month) : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    });
  }

  // === МЕТОДЫ ДЛЯ ЛИЧНОГО ПЛАНА РАЗВИТИЯ (PDP) ===

  @Get(':id/pdp')
  @ApiOperation({ summary: 'Получить персональный план развития студента' })
  @ApiResponse({ status: 200, description: 'Персональный план развития студента' })
  @ApiParam({ name: 'id', description: 'ID студента' })
  @Roles('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')
  getStudentPdp(@Param('id') id: string, @Request() req) {
    return this.studentsService.getStudentPdp(+id, req.user?.role, req.user?.id).then(res => res.plans);
  }

  @Post(':id/pdp')
  @ApiOperation({ summary: 'Создать/добавить персональный план развития студенту' })
  @ApiResponse({ status: 201, description: 'План развития создан' })
  @ApiParam({ name: 'id', description: 'ID студента' })
  @Roles('ADMIN', 'TEACHER', 'STUDENT')
  createStudentPdp(@Param('id') id: string, @Body() dto: CreatePdpPlanDto, @Request() req) {
    return this.studentsService.createStudentPdp(+id, dto, req.user?.role, req.user?.id).then(res => res.plan);
  }

  @Patch('pdp/:planId')
  @ApiOperation({ summary: 'Обновить план развития' })
  @ApiResponse({ status: 200, description: 'План развития обновлен' })
  @ApiParam({ name: 'planId', description: 'ID плана' })
  @Roles('ADMIN', 'TEACHER', 'STUDENT')
  updatePdpPlan(@Param('planId') planId: string, @Body() dto: UpdatePdpPlanDto, @Request() req) {
    return this.studentsService.updatePdpPlan(+planId, dto, req.user?.role, req.user?.id).then(res => res.plan);
  }

  @Delete('pdp/:planId')
  @ApiOperation({ summary: 'Удалить план развития' })
  @ApiResponse({ status: 200, description: 'План развития удален' })
  @ApiParam({ name: 'planId', description: 'ID плана' })
  @Roles('ADMIN', 'TEACHER', 'STUDENT')
  deletePdpPlan(@Param('planId') planId: string, @Request() req) {
    return this.studentsService.deletePdpPlan(+planId, req.user?.role, req.user?.id);
  }

  @Post('pdp/:planId/goals')
  @ApiOperation({ summary: 'Добавить цель в план развития' })
  @ApiResponse({ status: 201, description: 'Цель добавлена' })
  @ApiParam({ name: 'planId', description: 'ID плана' })
  @Roles('ADMIN', 'TEACHER', 'STUDENT')
  addPdpGoal(@Param('planId') planId: string, @Body() dto: CreatePdpGoalDto, @Request() req) {
    return this.studentsService.addPdpGoal(+planId, dto, req.user?.role, req.user?.id).then(res => res.goal);
  }

  @Patch('pdp/goals/:goalId')
  @ApiOperation({ summary: 'Обновить цель плана развития' })
  @ApiResponse({ status: 200, description: 'Цель обновлена' })
  @ApiParam({ name: 'goalId', description: 'ID цели' })
  @Roles('ADMIN', 'TEACHER', 'STUDENT')
  updatePdpGoal(@Param('goalId') goalId: string, @Body() dto: UpdatePdpGoalDto, @Request() req) {
    return this.studentsService.updatePdpGoal(+goalId, dto, req.user?.role, req.user?.id).then(res => res.goal);
  }

  @Delete('pdp/goals/:goalId')
  @ApiOperation({ summary: 'Удалить цель плана развития' })
  @ApiResponse({ status: 200, description: 'Цель удалена' })
  @ApiParam({ name: 'goalId', description: 'ID цели' })
  @Roles('ADMIN', 'TEACHER', 'STUDENT')
  deletePdpGoal(@Param('goalId') goalId: string, @Request() req) {
    return this.studentsService.deletePdpGoal(+goalId, req.user?.role, req.user?.id);
  }
}
