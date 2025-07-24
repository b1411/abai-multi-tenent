import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, ParseIntPipe, Req, BadRequestException } from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { LessonFilterDto } from './dto/lesson-filter.dto';
import { RolesGuard } from 'src/common/guards/role.guard';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Lesson } from './entities/lesson.entity';
import { PaginateResponseDto } from 'src/common/dtos/paginate.dto';
import { LessonScheduleService } from '../schedule/lesson-schedule.service';

@Controller('lessons')
@ApiTags('Lessons')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RolesGuard)
@Roles("ADMIN", "TEACHER")
export class LessonsController {
  constructor(
    private readonly lessonsService: LessonsService,
    private readonly lessonScheduleService: LessonScheduleService
  ) { }

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

  @Get('available')
  @ApiOperation({ 
    summary: 'Получить доступные уроки для планирования в расписании',
    description: 'Возвращает список уроков из календарно-тематического планирования, которые можно добавить в расписание'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Список доступных уроков'
  })
  @ApiResponse({ status: 400, description: 'Некорректные параметры запроса' })
  @ApiQuery({ 
    name: 'search', 
    required: false, 
    description: 'Поиск по названию урока, предмету или преподавателю',
    type: 'string'
  })
  @ApiQuery({ 
    name: 'groupIds', 
    required: false, 
    description: 'ID групп (разделенные запятыми)',
    type: 'string'
  })
  @ApiQuery({ 
    name: 'teacherIds', 
    required: false, 
    description: 'ID преподавателей (разделенные запятыми)',
    type: 'string'
  })
  @ApiQuery({ 
    name: 'subjectIds', 
    required: false, 
    description: 'ID учебных планов/предметов (разделенные запятыми)',
    type: 'string'
  })
  @ApiQuery({ 
    name: 'startDate', 
    required: false, 
    description: 'Начальная дата в формате YYYY-MM-DD',
    type: 'string'
  })
  @ApiQuery({ 
    name: 'endDate', 
    required: false, 
    description: 'Конечная дата в формате YYYY-MM-DD',
    type: 'string'
  })
  async getAvailableLessons(
    @Query('search') search?: string,
    @Query('groupIds') groupIds?: string,
    @Query('teacherIds') teacherIds?: string,
    @Query('subjectIds') subjectIds?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      // Парсим массивы ID из строк
      const parseIds = (idsString?: string): number[] | undefined => {
        if (!idsString) return undefined;
        return idsString.split(',').map(id => {
          const parsed = parseInt(id.trim());
          if (isNaN(parsed)) {
            throw new BadRequestException(`Invalid ID: ${id}`);
          }
          return parsed;
        });
      };

      // Валидация дат
      if (startDate && !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
        throw new BadRequestException('startDate must be in YYYY-MM-DD format');
      }
      if (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        throw new BadRequestException('endDate must be in YYYY-MM-DD format');
      }

      const filters = {
        search,
        groupIds: parseIds(groupIds),
        teacherIds: parseIds(teacherIds),
        subjectIds: parseIds(subjectIds),
        startDate,
        endDate
      };

      return await this.lessonScheduleService.getAvailableLessons(filters);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Invalid query parameters');
    }
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
