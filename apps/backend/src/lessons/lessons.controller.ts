import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, ParseIntPipe, Req } from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { LessonFilterDto } from './dto/lesson-filter.dto';
import { RolesGuard } from 'src/common/guards/role.guard';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Lesson } from './entities/lesson.entity';
import { PaginateResponseDto } from 'src/common/dtos/paginate.dto';

@Controller('lessons')
@ApiTags('Lessons')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RolesGuard)
@Roles("ADMIN", "TEACHER")
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) { }

  @Post()
  @ApiOperation({ summary: 'Создать новый урок' })
  @ApiResponse({
    status: 201,
    description: 'Урок успешно создан',
    type: Lesson
  })
  @ApiResponse({ status: 400, description: 'Неверные данные' })
  create(@Body() createLessonDto: CreateLessonDto): Promise<Lesson> {
    return this.lessonsService.create(createLessonDto);
  }

  @Get()
  @ApiOperation({ summary: 'Получить все уроки' })
  @ApiResponse({
    status: 200,
    description: 'Список уроков с пагинацией или без (если указан параметр noPagination)',
    type: PaginateResponseDto<Lesson>
  })
  async findAll(@Query() filters: LessonFilterDto): Promise<PaginateResponseDto<Lesson> | Lesson[]> {
    // Если указан параметр noPagination, возвращаем простой массив для журнала
    if (filters.noPagination === 'true') {
      const result = await this.lessonsService.findAll({
        ...filters,
        page: 1,
        limit: 1000, // Большой лимит для получения всех уроков
        noPagination: undefined // убираем этот параметр для сервиса
      });
      return result.data;
    }

    return this.lessonsService.findAll(filters);
  }

  @Get('me')
  @Roles("STUDENT")
  @ApiOperation({ summary: 'Получить уроки текущего студента' })
  @ApiResponse({
    status: 200,
    description: 'Список уроков студента',
    type: PaginateResponseDto<Lesson>
  })
  async findMyLessons(@Query() filters: LessonFilterDto, @Req() req: any): Promise<PaginateResponseDto<Lesson> | Lesson[]> {
    // Если указан параметр noPagination, возвращаем простой массив для журнала
    if (filters.noPagination === 'true') {
      const result = await this.lessonsService.findStudentLessons({
        ...filters,
        page: 1,
        limit: 1000, // Большой лимит для получения всех уроков
        noPagination: undefined // убираем этот параметр для сервиса
      }, req.user.id);
      return result.data;
    }

    return this.lessonsService.findStudentLessons(filters, req.user.id);
  }

  @Get('by-study-plan/:studyPlanId')
  @ApiOperation({ summary: 'Получить уроки по учебному плану' })
  @ApiParam({ name: 'studyPlanId', description: 'ID учебного плана' })
  @ApiResponse({
    status: 200,
    description: 'Список уроков учебного плана',
    type: [Lesson]
  })
  findByStudyPlan(@Param('studyPlanId', ParseIntPipe) studyPlanId: number): Promise<Lesson[]> {
    return this.lessonsService.findByStudyPlan(studyPlanId);
  }

  @Get(':id')
  @Roles("ADMIN", "TEACHER", "STUDENT")
  @ApiOperation({ summary: 'Получить урок по ID' })
  @ApiParam({ name: 'id', description: 'ID урока' })
  @ApiResponse({
    status: 200,
    description: 'Данные урока',
    type: Lesson
  })
  @ApiResponse({ status: 404, description: 'Урок не найден' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Lesson> {
    return this.lessonsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить урок' })
  @ApiParam({ name: 'id', description: 'ID урока' })
  @ApiResponse({
    status: 200,
    description: 'Урок успешно обновлен',
    type: Lesson
  })
  @ApiResponse({ status: 404, description: 'Урок не найден' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateLessonDto: UpdateLessonDto): Promise<Lesson> {
    return this.lessonsService.update(id, updateLessonDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить урок (мягкое удаление)' })
  @ApiParam({ name: 'id', description: 'ID урока' })
  @ApiResponse({
    status: 200,
    description: 'Урок успешно удален',
    type: Lesson
  })
  @ApiResponse({ status: 404, description: 'Урок не найден' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<Lesson> {
    return this.lessonsService.softRemove(id);
  }
}
