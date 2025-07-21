import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/role.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { AiAssistantService } from '../ai-assistant/ai-assistant.service';
import { GenerateScheduleDto } from '../ai-assistant/dto/generate-schedule.dto';
import { AIScheduleResponseDto } from '../ai-assistant/dto/ai-schedule-response.dto';

@ApiTags('Schedule')
@Controller('schedule')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN', 'TEACHER')
export class ScheduleController {
  constructor(
    private readonly scheduleService: ScheduleService,
    private readonly aiAssistantService: AiAssistantService
  ) {}

  @Post()
  @ApiOperation({ summary: 'Создать новое расписание' })
  @ApiResponse({ status: 201, description: 'Расписание успешно создано' })
  @ApiResponse({ status: 400, description: 'Некорректные данные или конфликт расписания' })
  @ApiResponse({ status: 404, description: 'Связанная сущность не найдена' })
  create(@Body() createScheduleDto: CreateScheduleDto) {
    return this.scheduleService.create(createScheduleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Получить все расписания' })
  @ApiResponse({ status: 200, description: 'Список всех расписаний' })
  @Roles('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')
  findAll() {
    return this.scheduleService.findAll();
  }

  @Get('group/:groupId')
  @ApiOperation({ summary: 'Получить расписание группы' })
  @ApiResponse({ status: 200, description: 'Расписание группы' })
  @ApiParam({ name: 'groupId', description: 'ID группы' })
  @Roles('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')
  findByGroup(@Param('groupId') groupId: string) {
    return this.scheduleService.findByGroup(+groupId);
  }

  @Get('teacher/:teacherId')
  @ApiOperation({ summary: 'Получить расписание преподавателя' })
  @ApiResponse({ status: 200, description: 'Расписание преподавателя' })
  @ApiParam({ name: 'teacherId', description: 'ID преподавателя' })
  @Roles('ADMIN', 'TEACHER')
  findByTeacher(@Param('teacherId') teacherId: string) {
    return this.scheduleService.findByTeacher(+teacherId);
  }

  @Get('classroom/:classroomId')
  @ApiOperation({ summary: 'Получить расписание аудитории' })
  @ApiResponse({ status: 200, description: 'Расписание аудитории' })
  @ApiParam({ name: 'classroomId', description: 'ID аудитории' })
  @Roles('ADMIN', 'TEACHER')
  findByClassroom(@Param('classroomId') classroomId: string) {
    return this.scheduleService.findByClassroom(+classroomId);
  }

  @Get('day/:dayOfWeek')
  @ApiOperation({ summary: 'Получить расписание на день недели' })
  @ApiResponse({ status: 200, description: 'Расписание на день' })
  @ApiParam({ 
    name: 'dayOfWeek', 
    description: 'День недели (1-7: понедельник-воскресенье)',
    example: 1
  })
  @Roles('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')
  findByDayOfWeek(@Param('dayOfWeek') dayOfWeek: string) {
    return this.scheduleService.findByDayOfWeek(+dayOfWeek);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить расписание по ID' })
  @ApiResponse({ status: 200, description: 'Данные расписания' })
  @ApiResponse({ status: 404, description: 'Расписание не найдено' })
  @ApiParam({ name: 'id', description: 'UUID расписания' })
  @Roles('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')
  findOne(@Param('id') id: string) {
    return this.scheduleService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить расписание' })
  @ApiResponse({ status: 200, description: 'Расписание успешно обновлено' })
  @ApiResponse({ status: 400, description: 'Некорректные данные или конфликт расписания' })
  @ApiResponse({ status: 404, description: 'Расписание не найдено' })
  @ApiParam({ name: 'id', description: 'UUID расписания' })
  update(@Param('id') id: string, @Body() updateScheduleDto: UpdateScheduleDto) {
    return this.scheduleService.update(id, updateScheduleDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить расписание' })
  @ApiResponse({ status: 200, description: 'Расписание успешно удалено' })
  @ApiResponse({ status: 404, description: 'Расписание не найдено' })
  @ApiParam({ name: 'id', description: 'UUID расписания' })
  remove(@Param('id') id: string) {
    return this.scheduleService.remove(id);
  }

  // ================================
  // AI Schedule Generation Endpoints
  // ================================

  @Post('ai-generate')
  @ApiOperation({ 
    summary: 'Генерировать расписание с помощью ИИ',
    description: 'Использует ChatGPT для создания оптимального расписания на основе заданных параметров и ограничений'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Расписание успешно сгенерировано',
    type: AIScheduleResponseDto
  })
  @ApiResponse({ status: 400, description: 'Некорректные параметры генерации' })
  @ApiResponse({ status: 500, description: 'Ошибка при обращении к ИИ сервису' })
  @Roles('ADMIN')
  async generateWithAI(@Body() generateScheduleDto: GenerateScheduleDto): Promise<AIScheduleResponseDto> {
    return this.aiAssistantService.generateScheduleWithAI(generateScheduleDto);
  }

  @Post('ai-analyze')
  @ApiOperation({ 
    summary: 'Анализировать существующее расписание с помощью ИИ',
    description: 'Использует ChatGPT для анализа расписания на предмет конфликтов и возможностей оптимизации'
  })
  @ApiResponse({ status: 200, description: 'Анализ расписания выполнен' })
  @ApiResponse({ status: 400, description: 'Некорректные данные для анализа' })
  @ApiResponse({ status: 500, description: 'Ошибка при обращении к ИИ сервису' })
  @Roles('ADMIN', 'TEACHER')
  async analyzeWithAI(@Body() scheduleItems: any[]) {
    return this.aiAssistantService.analyzeScheduleConflicts(scheduleItems);
  }

  @Post('ai-validate')
  @ApiOperation({ 
    summary: 'Валидировать сгенерированное расписание',
    description: 'Проверяет сгенерированное ИИ расписание на наличие конфликтов и соответствие ограничениям'
  })
  @ApiResponse({ status: 200, description: 'Валидация завершена' })
  @ApiResponse({ status: 400, description: 'Обнаружены критические конфликты' })
  @Roles('ADMIN')
  async validateAISchedule(@Body() scheduleItems: any[]) {
    // Здесь будет логика валидации сгенерированного расписания
    // Можно добавить дополнительные проверки помимо ИИ анализа
    const analysis = await this.aiAssistantService.analyzeScheduleConflicts(scheduleItems);
    
    // Проверяем наличие критических конфликтов
    const criticalIssues = analysis.detectedIssues?.filter(
      (issue: any) => issue.severity === 'critical' || issue.severity === 'high'
    ) || [];

    return {
      isValid: criticalIssues.length === 0,
      criticalIssues,
      analysis,
      recommendation: criticalIssues.length > 0 
        ? 'Необходимо устранить критические конфликты перед применением расписания'
        : 'Расписание готово к применению'
    };
  }

  @Post('ai-apply')
  @ApiOperation({ 
    summary: 'Применить сгенерированное ИИ расписание',
    description: 'Сохраняет проверенное и откорректированное расписание в базу данных'
  })
  @ApiResponse({ status: 201, description: 'Расписание успешно применено' })
  @ApiResponse({ status: 400, description: 'Расписание содержит ошибки' })
  @ApiResponse({ status: 409, description: 'Конфликт с существующим расписанием' })
  @Roles('ADMIN')
  async applyAISchedule(@Body() applyData: { scheduleItems: any[], replaceExisting?: boolean }) {
    const { scheduleItems, replaceExisting = false } = applyData;
    
    // Валидируем перед применением
    const validation = await this.validateAISchedule(scheduleItems);
    
    if (!validation.isValid && validation.criticalIssues.length > 0) {
      throw new Error(`Невозможно применить расписание: ${validation.criticalIssues.map((issue: any) => issue.issue).join(', ')}`);
    }

    // Применяем расписание через schedule service
    const results = [];
    
    for (const item of scheduleItems) {
      try {
        // Конвертируем AI формат в формат CreateScheduleDto
        const createDto: CreateScheduleDto = {
          studyPlanId: parseInt(item.studyPlanId) || 1, // Нужно будет маппить из subject
          groupId: parseInt(item.groupId) || 1,
          teacherId: parseInt(item.teacherId) || 1,
          classroomId: item.roomId ? parseInt(item.roomId) : undefined,
          dayOfWeek: this.convertDayToNumber(item.day),
          startTime: item.startTime,
          endTime: item.endTime
        };

        const created = await this.scheduleService.create(createDto);
        results.push({ success: true, item: created });
      } catch (error) {
        results.push({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error',
          item 
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;

    return {
      message: `Расписание применено. Успешно: ${successCount}, ошибок: ${errorCount}`,
      results,
      statistics: {
        total: scheduleItems.length,
        success: successCount,
        errors: errorCount
      }
    };
  }

  private convertDayToNumber(day: string): number {
    const dayMap: { [key: string]: number } = {
      'monday': 1,
      'tuesday': 2,
      'wednesday': 3,
      'thursday': 4,
      'friday': 5,
      'saturday': 6,
      'sunday': 7
    };
    return dayMap[day.toLowerCase()] || 1;
  }
}
