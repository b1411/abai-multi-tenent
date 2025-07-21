import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
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
  @Roles('ADMIN', 'HR')
  create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.create(createStudentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Получить всех студентов' })
  @ApiResponse({ status: 200, description: 'Список всех студентов с информацией о пользователях и группах' })
  @Roles('ADMIN', 'HR', 'TEACHER', 'STUDENT', 'PARENT')
  findAll() {
    return this.studentsService.findAll();
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
}
