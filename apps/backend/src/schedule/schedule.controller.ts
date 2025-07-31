import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/role.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { AiAssistantService } from '../ai-assistant/ai-assistant.service';

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

  @Post('update-statuses')
  @ApiOperation({ 
    summary: 'Принудительно обновить статусы прошедших занятий',
    description: 'Обновляет статусы занятий на COMPLETED если их время окончания уже прошло'
  })
  @ApiResponse({ status: 200, description: 'Статусы успешно обновлены' })
  @Roles('ADMIN', 'TEACHER')
  updateStatuses() {
    return this.scheduleService.updatePastScheduleStatuses();
  }

  // ================================
  // AI Schedule Generation Endpoints
  // ================================

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

  @Post('study-plans/from-ai')
  @ApiOperation({
    summary: 'Создать расписание из учебных планов с помощью AI',
    description: 'Генерирует расписание на основе учебных планов, распределяя часы по указанному периоду.'
  })
  @ApiResponse({ status: 201, description: 'Расписание успешно сгенерировано' })
  @ApiResponse({ status: 400, description: 'Некорректные параметры' })
  @ApiResponse({ status: 500, description: 'Ошибка при обращении к ИИ сервису' })
  @Roles('ADMIN')
  async createScheduleFromStudyPlansWithAI(@Body() params: {
    studyPlanIds?: number[];
    groupIds?: number[];
    teacherIds?: number[];
    startDate: string;
    endDate: string;
    constraints?: {
      workingHours?: { start: string; end: string };
      maxConsecutiveHours?: number;
      preferredBreaks?: string[];
      lessonsPerDayLimit?: number;
    };
  }) {
    const studyPlans = await this.scheduleService.findStudyPlansForScheduling(params);

    if (!studyPlans || studyPlans.length === 0) {
      throw new Error('Не найдено учебных планов для создания расписания');
    }

    const classrooms = await this.scheduleService.findAllClassrooms();
    const existingSchedules = await this.scheduleService.findSchedulesByDateRange(params.startDate, params.endDate);

    const prompt = this.aiAssistantService.generateStudyPlanPrompt(
      studyPlans,
      classrooms,
      existingSchedules,
      params.startDate,
      params.endDate,
      params.constraints
    );

    const aiResult = await this.aiAssistantService.getCompletion(prompt.system, prompt.user);

    const proposedSchedules = await this.scheduleService.processAiSchedulerResponse(aiResult, studyPlans, classrooms);

    return {
      success: true,
      message: `Сгенерировано предварительное расписание для ${studyPlans.length} учебных планов`,
      ...proposedSchedules
    };
  }

  @Post('lessons/from-ai')
  @ApiOperation({ 
    summary: 'Создать расписание из существующих уроков с помощью AI',
    description: 'Берет существующие уроки из базы данных и использует AI для их оптимального расставления по времени и аудиториям'
  })
  @ApiResponse({ status: 201, description: 'Расписание из уроков успешно создано' })
  @ApiResponse({ status: 400, description: 'Некорректные параметры' })
  @ApiResponse({ status: 500, description: 'Ошибка при обращении к ИИ сервису' })
  @Roles('ADMIN')
  async createScheduleFromLessonsWithAI(@Body() params: {
    lessonIds?: number[];
    groupIds?: number[];
    teacherIds?: number[];
    startDate: string;
    endDate: string;
    constraints?: {
      workingHours?: { start: string; end: string };
      maxConsecutiveHours?: number;
      preferredBreaks?: string[];
    };
  }) {
    // Получаем уроки из базы данных
    let lessons;
    
    if (params.lessonIds && params.lessonIds.length > 0) {
      // Если указаны конкретные уроки
      lessons = await this.scheduleService['prisma'].lesson.findMany({
        where: {
          id: { in: params.lessonIds },
          deletedAt: null
        },
        include: {
          studyPlan: {
            include: {
              teacher: { include: { user: true } },
              group: true
            }
          }
        }
      });
    } else {
      // Если указаны группы/преподаватели
      const whereClause: any = { deletedAt: null };
      
      if (params.groupIds && params.groupIds.length > 0) {
        whereClause.studyPlan = {
          group: {
            some: {
              id: { in: params.groupIds }
            }
          }
        };
      }
      
      if (params.teacherIds && params.teacherIds.length > 0) {
        whereClause.studyPlan = {
          ...whereClause.studyPlan,
          teacherId: { in: params.teacherIds }
        };
      }
      
      lessons = await this.scheduleService['prisma'].lesson.findMany({
        where: whereClause,
        include: {
          studyPlan: {
            include: {
              teacher: { include: { user: true } },
              group: true
            }
          }
        }
      });
    }

    if (!lessons || lessons.length === 0) {
      throw new Error('Не найдено уроков для создания расписания');
    }

    // Получаем доступные аудитории
    const classrooms = await this.scheduleService['prisma'].classroom.findMany({
      where: { deletedAt: null }
    });

    // Получаем существующие расписания для проверки конфликтов
    const existingSchedules = await this.scheduleService['prisma'].schedule.findMany({
      where: {
        deletedAt: null,
        ...(params.startDate && params.endDate && {
          date: {
            gte: new Date(params.startDate),
            lte: new Date(params.endDate)
          }
        })
      }
    });

    // Формируем промпт для AI
    const systemPrompt = `Ты эксперт по составлению расписаний. Твоя задача - оптимально расставить существующие уроки по времени и аудиториям.

ПРИНЦИПЫ:
1. Избегать конфликтов преподавателей, групп и аудиторий
2. Оптимально использовать аудитории по их типу
3. Равномерно распределять нагрузку
4. Соблюдать рабочие часы и перерывы

ТИПЫ АУДИТОРИЙ:
- LECTURE_HALL: для лекций
- LABORATORY: для практических работ
- COMPUTER_LAB: для IT-дисциплин
- AUDITORIUM: универсальная

Отвечай в JSON формате с полями: date, startTime, endTime, classroomId, lessonId`;

    const userPrompt = `Расставь следующие уроки по расписанию:

ПЕРИОД: ${params.startDate} - ${params.endDate}
РАБОЧИЕ ЧАСЫ: ${params.constraints?.workingHours?.start || '08:00'} - ${params.constraints?.workingHours?.end || '18:00'}

УРОКИ:
${lessons.map(lesson => `
- ID: ${lesson.id}
- Название: ${lesson.name}
- Дата урока: ${lesson.date.toISOString().split('T')[0]}
- Предмет: ${lesson.studyPlan.name}
- Группа: ${lesson.studyPlan.group.name}
- Преподаватель: ${lesson.studyPlan.teacher.user.name} ${lesson.studyPlan.teacher.user.surname}
`).join('')}

ДОСТУПНЫЕ АУДИТОРИИ:
${classrooms.map(room => `
- ID: ${room.id}, Название: ${room.name}, Тип: ${room.type}, Вместимость: ${room.capacity}
`).join('')}

СУЩЕСТВУЮЩИЕ РАСПИСАНИЯ (избегать конфликтов):
${existingSchedules.map(schedule => `
- Дата: ${schedule.date?.toISOString().split('T')[0]}, Время: ${schedule.startTime}-${schedule.endTime}, Преподаватель: ${schedule.teacherId}, Аудитория: ${schedule.classroomId}
`).join('')}

Создай оптимальное расписание в JSON формате:
{
  "schedules": [
    {
      "lessonId": number,
      "date": "YYYY-MM-DD",
      "startTime": "HH:MM",
      "endTime": "HH:MM", 
      "classroomId": number,
      "reasoning": "объяснение выбора"
    }
  ],
  "conflicts": ["список потенциальных конфликтов"],
  "recommendations": ["рекомендации по улучшению"]
}`;

    // Вызываем AI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-2024-08-06',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI service error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    let aiResultContent = data.choices[0].message.content;
    
    // Удаляем markdown форматирование если есть
    if (aiResultContent.startsWith('```json')) {
      aiResultContent = aiResultContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    }
    
    const aiResult = JSON.parse(aiResultContent);

    // Формируем предварительное расписание из уроков и AI предложений
    const proposedSchedules = [];

    for (const scheduleItem of aiResult.schedules) {
      const lesson = lessons.find(l => l.id === scheduleItem.lessonId);
      if (!lesson) continue;

      // Получаем первую группу из many-to-many связи
      const firstGroup = lesson.studyPlan.group[0];
      if (!firstGroup) continue;

      const classroom = classrooms.find(c => c.id === scheduleItem.classroomId);

      proposedSchedules.push({
        lessonId: lesson.id,
        lessonName: lesson.name,
        lessonDescription: lesson.description,
        date: scheduleItem.date,
        startTime: scheduleItem.startTime,
        endTime: scheduleItem.endTime,
        studyPlanId: lesson.studyPlanId,
        studyPlanName: lesson.studyPlan.name,
        groupId: firstGroup.id,
        groupName: firstGroup.name,
        teacherId: lesson.studyPlan.teacherId,
        teacherName: `${lesson.studyPlan.teacher.user.name} ${lesson.studyPlan.teacher.user.surname}`,
        classroomId: scheduleItem.classroomId,
        classroomName: classroom?.name || 'Не указана',
        reasoning: scheduleItem.reasoning,
        difficulty: 'intermediate' // можно добавить логику определения сложности
      });
    }

    return {
      success: true,
      message: `Сгенерировано предварительное расписание для ${proposedSchedules.length} из ${lessons.length} уроков`,
      generatedLessons: proposedSchedules,
      conflicts: aiResult.conflicts || [],
      recommendations: aiResult.recommendations || [],
      warnings: [],
      errors: [],
      statistics: {
        totalLessons: lessons.length,
        schedulesCreated: proposedSchedules.length,
        errors: 0
      },
      summary: {
        totalLessons: proposedSchedules.length,
        startDate: params.startDate,
        endDate: params.endDate,
        academicYear: '2024-2025',
        semester: 1
      },
      analysis: {
        overallScore: 85,
        efficiency: 90,
        teacherSatisfaction: 80,
        studentSatisfaction: 85,
        resourceUtilization: 88
      }
    };
  }

  @Post('lessons/apply')
  @ApiOperation({ 
    summary: 'Применить предварительное расписание уроков',
    description: 'Сохраняет подтвержденное пользователем расписание в базу данных'
  })
  @ApiResponse({ status: 201, description: 'Расписание успешно применено' })
  @ApiResponse({ status: 400, description: 'Ошибка при создании расписания' })
  @Roles('ADMIN')
  async applyLessonSchedule(@Body() applyData: { 
    generatedLessons: any[]; 
    replaceExisting?: boolean 
  }) {
    const { generatedLessons } = applyData;
    
    const results = [];
    const errors = [];
    
    for (const lesson of generatedLessons) {
      try {
        const createDto: CreateScheduleDto = {
          studyPlanId: lesson.studyPlanId,
          groupId: lesson.groupId,
          teacherId: lesson.teacherId,
          classroomId: lesson.classroomId,
          lessonId: lesson.lessonId,
          date: lesson.date,
          startTime: lesson.startTime,
          endTime: lesson.endTime,
          dayOfWeek: new Date(lesson.date).getDay(),
          type: 'REGULAR',
          status: 'SCHEDULED'
        };

        const created = await this.scheduleService.create(createDto);
        results.push(created);
      } catch (error) {
        errors.push({
          lessonId: lesson.lessonId,
          error: error instanceof Error ? error.message : 'Unknown error',
          lesson: lesson.lessonName
        });
      }
    }

    return {
      success: true,
      message: `Применено ${results.length} из ${generatedLessons.length} уроков`,
      applied: results,
      errors,
      statistics: {
        total: generatedLessons.length,
        applied: results.length,
        errors: errors.length
      }
    };
  }

  @Patch(':id/reschedule')
  @ApiOperation({ 
    summary: 'Перенести занятие на другую дату и время',
    description: 'Позволяет изменить дату и время конкретного занятия'
  })
  @ApiResponse({ status: 200, description: 'Занятие успешно перенесено' })
  @ApiResponse({ status: 400, description: 'Конфликт расписания' })
  @ApiResponse({ status: 404, description: 'Занятие не найдено' })
  @Roles('ADMIN')
  async rescheduleLesson(@Param('id') id: string, @Body() rescheduleData: {
    date?: string;
    startTime?: string;
    endTime?: string;
    classroomId?: number;
    reason?: string;
  }) {
    const updateData: UpdateScheduleDto = {};
    
    if (rescheduleData.date) {
      const newDate = new Date(rescheduleData.date);
      const dayOfWeek = newDate.getDay() === 0 ? 7 : newDate.getDay();
      updateData.date = rescheduleData.date;
      updateData.dayOfWeek = dayOfWeek;
    }
    
    if (rescheduleData.startTime) {
      updateData.startTime = rescheduleData.startTime;
    }
    
    if (rescheduleData.endTime) {
      updateData.endTime = rescheduleData.endTime;
    }
    
    if (rescheduleData.classroomId !== undefined) {
      updateData.classroomId = rescheduleData.classroomId;
    }

    return this.scheduleService.update(id, updateData);
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
