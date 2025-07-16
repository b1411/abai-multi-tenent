import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ParentsService } from './parents.service';
import { CreateParentDto } from './dto/create-parent.dto';
import { UpdateParentDto } from './dto/update-parent.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/role.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';

@ApiTags('Parents')
@Controller('parents')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
export class ParentsController {
  constructor(private readonly parentsService: ParentsService) {}

  @Post()
  @ApiOperation({ summary: 'Зарегистрировать пользователя как родителя' })
  @ApiResponse({ status: 201, description: 'Родитель успешно зарегистрирован' })
  @ApiResponse({ status: 409, description: 'Пользователь уже является родителем' })
  @Roles('ADMIN', 'HR')
  create(@Body() createParentDto: CreateParentDto) {
    return this.parentsService.create(createParentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Получить всех родителей' })
  @ApiResponse({ status: 200, description: 'Список всех родителей с информацией о пользователях' })
  @Roles('ADMIN', 'HR', 'TEACHER')
  findAll() {
    return this.parentsService.findAll();
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Получить запись родителя по ID пользователя' })
  @ApiResponse({ status: 200, description: 'Информация о родителе' })
  @ApiParam({ name: 'userId', description: 'ID пользователя' })
  @Roles('ADMIN', 'HR', 'TEACHER', 'PARENT')
  findByUser(@Param('userId') userId: string) {
    return this.parentsService.findByUser(+userId);
  }

  @Get('search')
  @ApiOperation({ summary: 'Поиск родителей' })
  @ApiResponse({ status: 200, description: 'Результаты поиска родителей' })
  @ApiQuery({ name: 'q', description: 'Поисковый запрос' })
  @Roles('ADMIN', 'HR', 'TEACHER')
  search(@Query('q') query: string) {
    return this.parentsService.searchParents(query);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Получить статистику родителей' })
  @ApiResponse({ status: 200, description: 'Статистика родителей' })
  @Roles('ADMIN', 'HR')
  getStatistics() {
    return this.parentsService.getParentStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить родителя по ID' })
  @ApiResponse({ status: 200, description: 'Полная информация о родителе' })
  @ApiResponse({ status: 404, description: 'Родитель не найден' })
  @ApiParam({ name: 'id', description: 'ID родителя' })
  @Roles('ADMIN', 'HR', 'TEACHER', 'PARENT')
  findOne(@Param('id') id: string) {
    return this.parentsService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить данные родителя' })
  @ApiResponse({ status: 200, description: 'Данные родителя успешно обновлены' })
  @ApiResponse({ status: 404, description: 'Родитель не найден' })
  @ApiParam({ name: 'id', description: 'ID родителя' })
  @Roles('ADMIN', 'HR')
  update(@Param('id') id: string, @Body() updateParentDto: UpdateParentDto) {
    return this.parentsService.update(+id, updateParentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить родителя' })
  @ApiResponse({ status: 200, description: 'Родитель успешно удален' })
  @ApiResponse({ status: 404, description: 'Родитель не найден' })
  @ApiParam({ name: 'id', description: 'ID родителя' })
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.parentsService.remove(+id);
  }
}
