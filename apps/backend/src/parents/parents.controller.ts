import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ParentsService } from './parents.service';
import { CreateParentDto } from './dto/create-parent.dto';
import { UpdateParentDto } from './dto/update-parent.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { PermissionGuard, RequirePermission } from '../common/guards/permission.guard';
import { RolesGuard } from '../common/guards/role.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';

@ApiTags('Parents')
@Controller('parents')
@ApiBearerAuth()
@UseGuards(AuthGuard, PermissionGuard)
export class ParentsController {
  constructor(private readonly parentsService: ParentsService) {}

  @Post()
  @RequirePermission('parents', 'create')
  @ApiOperation({ summary: 'Зарегистрировать пользователя как родителя' })
  @ApiResponse({ status: 201, description: 'Родитель успешно зарегистрирован' })
  @ApiResponse({ status: 409, description: 'Пользователь уже является родителем' })
  create(@Body() createParentDto: CreateParentDto) {
    return this.parentsService.create(createParentDto);
  }

  @Get()
  @RequirePermission('parents', 'read')
  @ApiOperation({ summary: 'Получить всех родителей' })
  @ApiResponse({ status: 200, description: 'Список всех родителей с информацией о пользователях' })
  findAll() {
    return this.parentsService.findAll();
  }

  @Get('user/:userId')
  @RequirePermission('parents', 'read', { scope: 'OWN' })
  @ApiOperation({ summary: 'Получить запись родителя по ID пользователя' })
  @ApiResponse({ status: 200, description: 'Информация о родителе' })
  @ApiParam({ name: 'userId', description: 'ID пользователя' })
  findByUser(@Param('userId') userId: string) {
    return this.parentsService.findByUser(+userId);
  }

  @Get('search')
  @RequirePermission('parents', 'read')
  @ApiOperation({ summary: 'Поиск родителей' })
  @ApiResponse({ status: 200, description: 'Результаты поиска родителей' })
  @ApiQuery({ name: 'q', description: 'Поисковый запрос' })
  search(@Query('q') query: string) {
    return this.parentsService.searchParents(query);
  }

  @Get('statistics')
  @RequirePermission('reports', 'read')
  @ApiOperation({ summary: 'Получить статистику родителей' })
  @ApiResponse({ status: 200, description: 'Статистика родителей' })
  getStatistics() {
    return this.parentsService.getParentStatistics();
  }

  @Get(':id')
  @RequirePermission('parents', 'read', { scope: 'OWN' })
  @ApiOperation({ summary: 'Получить родителя по ID' })
  @ApiResponse({ status: 200, description: 'Полная информация о родителе' })
  @ApiResponse({ status: 404, description: 'Родитель не найден' })
  @ApiParam({ name: 'id', description: 'ID родителя' })
  findOne(@Param('id') id: string) {
    return this.parentsService.findOne(+id);
  }

  @Patch(':id')
  @RequirePermission('parents', 'update')
  @ApiOperation({ summary: 'Обновить данные родителя' })
  @ApiResponse({ status: 200, description: 'Данные родителя успешно обновлены' })
  @ApiResponse({ status: 404, description: 'Родитель не найден' })
  @ApiParam({ name: 'id', description: 'ID родителя' })
  update(@Param('id') id: string, @Body() updateParentDto: UpdateParentDto) {
    return this.parentsService.update(+id, updateParentDto);
  }

  @Delete(':id')
  @RequirePermission('parents', 'delete')
  @ApiOperation({ summary: 'Удалить родителя' })
  @ApiResponse({ status: 200, description: 'Родитель успешно удален' })
  @ApiResponse({ status: 404, description: 'Родитель не найден' })
  @ApiParam({ name: 'id', description: 'ID родителя' })
  remove(@Param('id') id: string) {
    return this.parentsService.remove(+id);
  }
}
