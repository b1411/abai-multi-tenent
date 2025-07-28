import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { CreateFullStudentDto } from './dto/create-full-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { PermissionGuard, RequirePermission } from '../common/guards/permission.guard';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('Students')
@Controller('students')
@ApiBearerAuth()
@UseGuards(AuthGuard, PermissionGuard)
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
  @RequirePermission('students', 'create')
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
  @RequirePermission('students', 'create')
  createFullStudent(@Body() createFullStudentDto: CreateFullStudentDto, @Request() req) {
    return this.studentsService.createFullStudent(createFullStudentDto, req.user?.role);
  }

  @Get()
  @ApiOperation({ summary: 'Получить всех студентов' })
  @ApiResponse({ status: 200, description: 'Список всех студентов с информацией о пользователях и группах' })
  @RequirePermission('students', 'read')
  findAll() {
    return this.studentsService.findAll();
  }

  @Get('group/:groupId')
  @ApiOperation({ summary: 'Получить студентов группы' })
  @ApiResponse({ status: 200, description: 'Список студентов указанной группы' })
  @ApiResponse({ status: 404, description: 'Группа не найдена' })
  @ApiParam({ name: 'groupId', description: 'ID группы' })
  @RequirePermission('students', 'read', { scope: 'GROUP' })
  findByGroup(@Param('groupId') groupId: string) {
    return this.studentsService.findByGroup(+groupId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Получить запись студента по ID пользователя' })
  @ApiResponse({ status: 200, description: 'Информация о студенте' })
  @ApiResponse({ status: 404, description: 'Студент не найден' })
  @ApiParam({ name: 'userId', description: 'ID пользователя' })
  @RequirePermission('students', 'read', { scope: 'OWN' })
  findByUser(@Param('userId') userId: string) {
    return this.studentsService.findByUser(+userId);
  }

  @Get(':id/grades')
  @ApiOperation({ summary: 'Получить все оценки студента по предметам' })
  @ApiResponse({ status: 200, description: 'Оценки студента сгруппированные по предметам со статистикой' })
  @ApiResponse({ status: 404, description: 'Студент не найден' })
  @ApiParam({ name: 'id', description: 'ID студента' })
  @RequirePermission('students', 'read', { scope: 'OWN' })
  getStudentGrades(@Param('id') id: string) {
    return this.studentsService.getStudentGrades(+id);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Получить статистику студентов' })
  @ApiResponse({ status: 200, description: 'Статистика студентов по группам' })
  @RequirePermission('reports', 'read')
  getStatistics() {
    return this.studentsService.getStudentStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить студента по ID' })
  @ApiResponse({ status: 200, description: 'Полная информация о студенте' })
  @ApiResponse({ status: 404, description: 'Студент не найден' })
  @ApiParam({ name: 'id', description: 'ID студента' })
  @RequirePermission('students', 'read', { scope: 'OWN' })
  findOne(@Param('id') id: string) {
    return this.studentsService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить данные студента' })
  @ApiResponse({ status: 200, description: 'Данные студента успешно обновлены' })
  @ApiResponse({ status: 404, description: 'Студент не найден' })
  @ApiParam({ name: 'id', description: 'ID студента' })
  @RequirePermission('students', 'update')
  update(@Param('id') id: string, @Body() updateStudentDto: UpdateStudentDto) {
    return this.studentsService.update(+id, updateStudentDto);
  }

  @Patch(':id/change-group/:newGroupId')
  @ApiOperation({ summary: 'Перевести студента в другую группу' })
  @ApiResponse({ status: 200, description: 'Студент успешно переведен в новую группу' })
  @ApiResponse({ status: 404, description: 'Студент или группа не найдены' })
  @ApiParam({ name: 'id', description: 'ID студента' })
  @ApiParam({ name: 'newGroupId', description: 'ID новой группы' })
  @RequirePermission('students', 'update')
  changeGroup(@Param('id') id: string, @Param('newGroupId') newGroupId: string) {
    return this.studentsService.changeStudentGroup(+id, +newGroupId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Отчислить студента' })
  @ApiResponse({ status: 200, description: 'Студент успешно отчислен' })
  @ApiResponse({ status: 404, description: 'Студент не найден' })
  @ApiParam({ name: 'id', description: 'ID студента' })
  @RequirePermission('students', 'delete')
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
  @RequirePermission('students', 'update')
  addParentToStudent(@Param('id') id: string, @Param('parentId') parentId: string) {
    return this.studentsService.addParentToStudent(+id, +parentId);
  }

  @Delete(':id/parents/:parentId')
  @ApiOperation({ summary: 'Отвязать родителя от студента' })
  @ApiResponse({ status: 200, description: 'Родитель успешно отвязан от студента' })
  @ApiResponse({ status: 404, description: 'Студент, родитель не найден или связь не существует' })
  @ApiParam({ name: 'id', description: 'ID студента' })
  @ApiParam({ name: 'parentId', description: 'ID родителя' })
  @RequirePermission('students', 'update')
  removeParentFromStudent(@Param('id') id: string, @Param('parentId') parentId: string) {
    return this.studentsService.removeParentFromStudent(+id, +parentId);
  }

  @Get(':id/parents')
  @ApiOperation({ summary: 'Получить всех родителей студента' })
  @ApiResponse({ status: 200, description: 'Список родителей студента' })
  @ApiResponse({ status: 404, description: 'Студент не найден' })
  @ApiParam({ name: 'id', description: 'ID студента' })
  @RequirePermission('students', 'read', { scope: 'OWN' })
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
  @RequirePermission('students', 'read', { scope: 'OWN' })
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
  @RequirePermission('payments', 'read', { scope: 'ASSIGNED' })
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
  @RequirePermission('students', 'read', { scope: 'ASSIGNED' })
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
  @RequirePermission('reports', 'read', { scope: 'ASSIGNED' })
  getStudentCompleteReport(@Param('id') id: string, @Request() req) {
    return this.studentsService.getStudentCompleteReport(+id, req.user?.role, req.user?.id);
  }
}
