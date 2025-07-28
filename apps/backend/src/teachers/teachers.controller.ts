import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { PermissionGuard, RequirePermission } from '../common/guards/permission.guard';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('Teachers')
@Controller('teachers')
@ApiBearerAuth()
@UseGuards(AuthGuard, PermissionGuard)
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Post()
  @ApiOperation({ summary: 'Создать нового учителя' })
  @ApiResponse({ status: 201, description: 'Учитель успешно создан' })
  @ApiResponse({ status: 400, description: 'Некорректные данные' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав' })
  @RequirePermission('teachers', 'create')
  create(@Body() createTeacherDto: CreateTeacherDto) {
    return this.teachersService.create(createTeacherDto);
  }

  @Get()
  @ApiOperation({ summary: 'Получить всех учителей' })
  @ApiResponse({ status: 200, description: 'Список всех учителей' })
  @RequirePermission('teachers', 'read')
  findAll() {
    return this.teachersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить учителя по ID' })
  @ApiResponse({ status: 200, description: 'Информация об учителе' })
  @ApiResponse({ status: 404, description: 'Учитель не найден' })
  @ApiParam({ name: 'id', description: 'ID учителя' })
  @RequirePermission('teachers', 'read', { scope: 'OWN' })
  findOne(@Param('id') id: string) {
    return this.teachersService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить данные учителя' })
  @ApiResponse({ status: 200, description: 'Учитель успешно обновлен' })
  @ApiResponse({ status: 404, description: 'Учитель не найден' })
  @ApiParam({ name: 'id', description: 'ID учителя' })
  @RequirePermission('teachers', 'update')
  update(@Param('id') id: string, @Body() updateTeacherDto: UpdateTeacherDto) {
    return this.teachersService.update(+id, updateTeacherDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить учителя' })
  @ApiResponse({ status: 200, description: 'Учитель успешно удален' })
  @ApiResponse({ status: 404, description: 'Учитель не найден' })
  @ApiParam({ name: 'id', description: 'ID учителя' })
  @RequirePermission('teachers', 'delete')
  remove(@Param('id') id: string) {
    return this.teachersService.remove(+id);
  }
}
