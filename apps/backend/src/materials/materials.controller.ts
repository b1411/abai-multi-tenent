import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { MaterialsService } from './materials.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { CreateLessonMaterialsDto } from './dto/create-lesson-materials.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { PermissionGuard, RequirePermission } from '../common/guards/permission.guard';
import { RolesGuard } from '../common/guards/role.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Materials')
@Controller('materials')
@ApiBearerAuth()
@UseGuards(AuthGuard, PermissionGuard)
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Post()
  @RequirePermission('materials', 'create')
  @ApiOperation({ summary: 'Создать новый материал' })
  @ApiResponse({ status: 201, description: 'Материал успешно создан' })
  @ApiResponse({ status: 400, description: 'Некорректные данные' })
  create(@Body() createMaterialDto: CreateMaterialDto) {
    return this.materialsService.create(createMaterialDto);
  }

  @Get()
  @RequirePermission('materials', 'read')
  @ApiOperation({ summary: 'Получить все материалы' })
  @ApiResponse({ status: 200, description: 'Список всех материалов' })
  findAll() {
    return this.materialsService.findAll();
  }

  @Get(':id')
  @RequirePermission('materials', 'read')
  @ApiOperation({ summary: 'Получить материал по ID' })
  @ApiResponse({ status: 200, description: 'Данные материала' })
  @ApiResponse({ status: 404, description: 'Материал не найден' })
  findOne(@Param('id') id: string) {
    return this.materialsService.findOne(+id);
  }

  @Get('lesson/:lessonId')
  @RequirePermission('materials', 'read', { scope: 'ASSIGNED' })
  @ApiOperation({ summary: 'Получить материалы урока' })
  @ApiResponse({ status: 200, description: 'Материалы урока' })
  @ApiResponse({ status: 404, description: 'Урок не найден' })
  findByLesson(@Param('lessonId') lessonId: string) {
    return this.materialsService.findByLessonId(+lessonId);
  }

  @Patch(':id')
  @RequirePermission('materials', 'update')
  @ApiOperation({ summary: 'Обновить материал' })
  @ApiResponse({ status: 200, description: 'Материал успешно обновлен' })
  @ApiResponse({ status: 404, description: 'Материал не найден' })
  update(@Param('id') id: string, @Body() updateMaterialDto: UpdateMaterialDto) {
    return this.materialsService.update(+id, updateMaterialDto);
  }

  @Post('lesson/:lessonId/create-full-materials')
  @RequirePermission('materials', 'create')
  @ApiOperation({ summary: 'Создать полные материалы для урока (лекция, видео, презентация, тест, ДЗ)' })
  @ApiResponse({ status: 201, description: 'Материалы урока успешно созданы' })
  @ApiResponse({ status: 404, description: 'Урок не найден' })
  @ApiResponse({ status: 400, description: 'Некорректные данные' })
  createLessonMaterials(
    @Param('lessonId') lessonId: string,
    @Body() createLessonMaterialsDto: CreateLessonMaterialsDto,
  ) {
    return this.materialsService.createLessonMaterials(+lessonId, createLessonMaterialsDto);
  }

  @Post(':materialId/attach-to-lesson/:lessonId')
  @RequirePermission('materials', 'update')
  @ApiOperation({ summary: 'Прикрепить материал к уроку' })
  @ApiResponse({ status: 200, description: 'Материал успешно прикреплен к уроку' })
  @ApiResponse({ status: 404, description: 'Материал или урок не найден' })
  attachToLesson(
    @Param('materialId') materialId: string,
    @Param('lessonId') lessonId: string,
  ) {
    return this.materialsService.attachToLesson(+materialId, +lessonId);
  }

  @Delete(':id')
  @RequirePermission('materials', 'delete')
  @ApiOperation({ summary: 'Удалить материал' })
  @ApiResponse({ status: 200, description: 'Материал успешно удален' })
  @ApiResponse({ status: 404, description: 'Материал не найден' })
  remove(@Param('id') id: string) {
    return this.materialsService.remove(+id);
  }
}
