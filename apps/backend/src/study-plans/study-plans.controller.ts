import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards, Query, ParseIntPipe, Req } from '@nestjs/common';
import { StudyPlansService } from './study-plans.service';
import { StudyPlanFilterDto } from './dto/study-plan-filter.dto';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/role.guard';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CreateStudyPlanDto } from './dto/create-study-plan.dto';
import { UpdateStudyPlanDto } from './dto/update-study-plan-dto';
import { StudyPlan } from './entities/study-plan.entity';
import { PaginateResponseDto } from 'src/common/dtos/paginate.dto';

@Controller('study-plans')
@ApiTags('Study Plans')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RolesGuard)
export class StudyPlansController {
  constructor(private readonly studyPlansService: StudyPlansService) { }

  @Get()
  @Roles("ADMIN", "TEACHER", "STUDENT")
  @ApiOperation({ summary: 'Получить все учебные планы' })
  @ApiResponse({ 
    status: 200, 
    description: 'Список учебных планов с пагинацией',
    type: PaginateResponseDto<StudyPlan>
  })
  findAll(@Query() filter: StudyPlanFilterDto, @Req() req: any): Promise<PaginateResponseDto<StudyPlan>> {
    // Для студентов возвращаем только их планы
    if (req.user.role === 'STUDENT') {
      return this.studyPlansService.findStudentStudyPlans(filter, req.user.id);
    }
    // Для админов и преподавателей возвращаем все планы
    return this.studyPlansService.findAll(filter);
  }

  @Get('me')
  @Roles("STUDENT")
  @ApiOperation({ summary: 'Получить учебные планы текущего студента' })
  @ApiResponse({ 
    status: 200, 
    description: 'Список учебных планов студента',
    type: PaginateResponseDto<StudyPlan>
  })
  findMyStudyPlans(@Query() filter: StudyPlanFilterDto, @Req() req: any): Promise<PaginateResponseDto<StudyPlan>> {
    return this.studyPlansService.findStudentStudyPlans(filter, req.user.id);
  }

  @Get(':id')
  @Roles("ADMIN", "TEACHER", "STUDENT")
  @ApiOperation({ summary: 'Получить учебный план по ID' })
  @ApiParam({ name: 'id', description: 'ID учебного плана' })
  @ApiResponse({ 
    status: 200, 
    description: 'Данные учебного плана',
    type: StudyPlan
  })
  @ApiResponse({ status: 404, description: 'Учебный план не найден' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<StudyPlan> {
    return this.studyPlansService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Создать новый учебный план' })
  @ApiResponse({ 
    status: 201, 
    description: 'Учебный план успешно создан',
    type: StudyPlan
  })
  @ApiResponse({ status: 400, description: 'Неверные данные' })
  create(@Body() createStudyPlanDto: CreateStudyPlanDto): Promise<StudyPlan> {
    return this.studyPlansService.create(createStudyPlanDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить учебный план' })
  @ApiParam({ name: 'id', description: 'ID учебного плана' })
  @ApiResponse({ 
    status: 200, 
    description: 'Учебный план успешно обновлен',
    type: StudyPlan
  })
  @ApiResponse({ status: 404, description: 'Учебный план не найден' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateStudyPlanDto: UpdateStudyPlanDto): Promise<StudyPlan> {
    return this.studyPlansService.update(id, updateStudyPlanDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить учебный план (мягкое удаление)' })
  @ApiParam({ name: 'id', description: 'ID учебного плана' })
  @ApiResponse({ 
    status: 200, 
    description: 'Учебный план успешно удален',
    type: StudyPlan
  })
  @ApiResponse({ status: 404, description: 'Учебный план не найден' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<StudyPlan> {
    return this.studyPlansService.softRemove(id);
  }
}
