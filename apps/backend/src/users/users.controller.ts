import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/role.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  @ApiOperation({ summary: 'Создать нового пользователя (регистрация)' })
  @ApiResponse({ status: 201, description: 'Пользователь успешно создан' })
  @ApiResponse({ status: 400, description: 'Некорректные данные' })
  @ApiResponse({ status: 409, description: 'Пользователь с таким email уже существует' })
  @Roles('ADMIN', 'TEACHER')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Получить всех пользователей' })
  @ApiResponse({ status: 200, description: 'Список всех пользователей' })
  @Roles('ADMIN', 'HR', "FINANCIST", "TEACHER")
  findAll() {
    return this.usersService.findAll();
  }

  @Get('role/:role')
  @ApiOperation({ summary: 'Получить пользователей по роли' })
  @ApiResponse({ status: 200, description: 'Пользователи с указанной ролью' })
  @ApiParam({
    name: 'role',
    description: 'Роль пользователя',
    enum: ['STUDENT', 'TEACHER', 'PARENT', 'ADMIN', 'FINANCIST', 'HR']
  })
  @Roles('ADMIN', 'HR', 'TEACHER', "PARENT", "STUDENT", "FINANCIST", "HR")
  findByRole(@Param('role') role: string, @Req() req: any) {
    // Если студент запрашивает учителей, фильтруем только по его группе
    if (role === 'TEACHER' && req.user.role === 'STUDENT') {
      return this.usersService.findByRole(role, req.user.id);
    }
    return this.usersService.findByRole(role);
  }

  @Get('search')
  @ApiOperation({ summary: 'Поиск пользователей' })
  @ApiResponse({ status: 200, description: 'Результаты поиска пользователей' })
  @ApiQuery({ name: 'q', description: 'Поисковый запрос (имя, фамилия, email, телефон)' })
  @Roles('ADMIN', 'HR', 'TEACHER', "FINANCIST", "STUDENT")
  searchUsers(@Query('q') query: string) {
    return this.usersService.searchUsers(query);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Получить статистику пользователей' })
  @ApiResponse({ status: 200, description: 'Статистика пользователей по ролям' })
  @Roles('ADMIN', 'HR')
  getStatistics() {
    return this.usersService.getUserStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить пользователя по ID' })
  @ApiResponse({ status: 200, description: 'Полная информация о пользователе' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  @ApiParam({ name: 'id', description: 'ID пользователя' })
  @Roles('ADMIN', 'HR', 'TEACHER', 'PARENT', 'STUDENT')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить пользователя' })
  @ApiResponse({ status: 200, description: 'Пользователь успешно обновлен' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  @ApiResponse({ status: 409, description: 'Email уже используется' })
  @ApiParam({ name: 'id', description: 'ID пользователя' })
  @Roles('ADMIN', 'HR')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Post(':id/change-password')
  @ApiOperation({ summary: 'Изменить пароль пользователя' })
  @ApiResponse({ status: 200, description: 'Пароль успешно изменен' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  @ApiResponse({ status: 409, description: 'Неверный старый пароль' })
  @ApiParam({ name: 'id', description: 'ID пользователя' })
  @Roles('ADMIN', 'HR', 'TEACHER', 'PARENT', 'STUDENT')
  changePassword(
    @Param('id') id: string,
    @Body() body: { oldPassword: string; newPassword: string },
  ) {
    return this.usersService.changePassword(+id, body.oldPassword, body.newPassword);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить пользователя' })
  @ApiResponse({ status: 200, description: 'Пользователь успешно удален' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  @ApiParam({ name: 'id', description: 'ID пользователя' })
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
