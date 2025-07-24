import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/role.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ScheduleAiService } from './schedule-ai.service';
import { ScheduleManagementService } from './schedule-management.service';
import {
  GenerateScheduleDto,
  RescheduleDto,
  CancelScheduleDto,
  AssignSubstituteDto,
  BatchOperationDto,
  DetectConflictsDto,
  SuggestClassroomDto,
  ScheduleOptimizationResultDto,
  ScheduleOperationResultDto,
  BatchOperationResultDto,
  VacationSubstitutionResultDto
} from './dto/schedule-management.dto';

@ApiTags('Schedule AI & Management')
@Controller('schedule-ai')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN', 'TEACHER')
@ApiBearerAuth()
export class ScheduleAiController {
  constructor(
    private readonly scheduleAiService: ScheduleAiService,
    private readonly scheduleManagementService: ScheduleManagementService
  ) {}

  @Post('generate')
  @ApiOperation({ 
    summary: 'Генерирует оптимизированное расписание с помощью AI',
    description: 'Автоматически создает расписание на основе уроков с учетом конфликтов и предпочтений'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Расписание успешно сгенерировано',
    type: ScheduleOptimizationResultDto
  })
  async generateOptimizedSchedule(
    @Body() generateDto: GenerateScheduleDto
  ): Promise<ScheduleOptimizationResultDto> {
    const params = {
      studyPlanId: generateDto.studyPlanId,
      groupId: generateDto.groupId,
      teacherId: generateDto.teacherId,
      startDate: new Date(generateDto.startDate),
      endDate: new Date(generateDto.endDate),
      preferredTimes: generateDto.preferredTimes,
      excludedDates: generateDto.excludedDates?.map(date => new Date(date)),
      preferredClassrooms: generateDto.preferredClassrooms,
      maxLessonsPerDay: generateDto.maxLessonsPerDay,
      minBreakBetweenLessons: generateDto.minBreakBetweenLessons
    };

    return this.scheduleAiService.generateOptimizedSchedule(params);
  }

  @Post('conflicts/detect')
  @ApiOperation({ 
    summary: 'Проверяет конфликты расписания',
    description: 'Анализирует потенциальные конфликты для указанного времени и участников'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Анализ конфликтов выполнен',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['TEACHER_BUSY', 'CLASSROOM_BUSY', 'STUDENT_GROUP_BUSY', 'VACATION_CONFLICT'] },
          description: { type: 'string' },
          severity: { type: 'number', minimum: 1, maximum: 3 },
          affectedSchedules: { type: 'array', items: { type: 'string' } },
          suggestedResolution: { type: 'string' }
        }
      }
    }
  })
  async detectConflicts(@Body() conflictsDto: DetectConflictsDto) {
    return this.scheduleAiService.detectScheduleConflicts(
      new Date(conflictsDto.date),
      conflictsDto.startTime,
      conflictsDto.endTime,
      conflictsDto.teacherId,
      conflictsDto.classroomId,
      conflictsDto.groupId,
      conflictsDto.excludeScheduleId
    );
  }

  @Post('classroom/suggest')
  @ApiOperation({ 
    summary: 'Предлагает оптимальную аудиторию',
    description: 'AI-анализ подходящих аудиторий на основе типа урока и требований'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Предложения аудиторий получены',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          classroom: { type: 'object' },
          confidence: { type: 'number', minimum: 0, maximum: 1 }
        }
      }
    }
  })
  async suggestOptimalClassroom(@Body() suggestDto: SuggestClassroomDto) {
    return this.scheduleAiService.suggestOptimalClassroom(
      suggestDto.lessonType,
      suggestDto.groupSize,
      new Date(suggestDto.date),
      suggestDto.startTime,
      suggestDto.endTime,
      suggestDto.preferredClassrooms
    );
  }

  @Post(':scheduleId/reschedule')
  @ApiOperation({ 
    summary: 'Переносит занятие',
    description: 'Переносит занятие на новое время с проверкой конфликтов'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Занятие перенесено',
    type: ScheduleOperationResultDto
  })
  async rescheduleLesson(
    @Param('scheduleId') scheduleId: string,
    @Body() rescheduleDto: RescheduleDto
  ): Promise<ScheduleOperationResultDto> {
    const request = {
      scheduleId,
      newDate: new Date(rescheduleDto.newDate),
      newStartTime: rescheduleDto.newStartTime,
      newEndTime: rescheduleDto.newEndTime,
      newClassroomId: rescheduleDto.newClassroomId,
      reason: rescheduleDto.reason,
      notifyParticipants: rescheduleDto.notifyParticipants ?? true
    };

    return this.scheduleManagementService.rescheduleLesson(request);
  }

  @Post(':scheduleId/cancel')
  @ApiOperation({ 
    summary: 'Отменяет занятие',
    description: 'Отменяет запланированное занятие с уведомлением участников'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Занятие отменено',
    type: ScheduleOperationResultDto
  })
  async cancelLesson(
    @Param('scheduleId') scheduleId: string,
    @Body() cancelDto: CancelScheduleDto
  ): Promise<ScheduleOperationResultDto> {
    const request = {
      scheduleId,
      reason: cancelDto.reason,
      notifyParticipants: cancelDto.notifyParticipants ?? true
    };

    return this.scheduleManagementService.cancelLesson(request);
  }

  @Post(':scheduleId/substitute')
  @ApiOperation({ 
    summary: 'Назначает замещающего преподавателя',
    description: 'Назначает замещающего преподавателя с проверкой доступности'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Замещающий преподаватель назначен',
    type: ScheduleOperationResultDto
  })
  async assignSubstitute(
    @Param('scheduleId') scheduleId: string,
    @Body() substituteDto: AssignSubstituteDto
  ): Promise<ScheduleOperationResultDto> {
    const request = {
      scheduleId,
      substituteTeacherId: substituteDto.substituteTeacherId,
      reason: substituteDto.reason,
      notes: substituteDto.notes,
      notifyParticipants: substituteDto.notifyParticipants ?? true
    };

    return this.scheduleManagementService.assignSubstitute(request);
  }

  @Post('batch')
  @ApiOperation({ 
    summary: 'Выполняет массовые операции с расписанием',
    description: 'Применяет одну операцию к множеству расписаний одновременно'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Массовая операция выполнена',
    type: BatchOperationResultDto
  })
  async performBatchOperation(
    @Body() batchDto: BatchOperationDto
  ): Promise<BatchOperationResultDto> {
    return this.scheduleManagementService.performBatchOperation({
      operation: batchDto.operation,
      scheduleIds: batchDto.scheduleIds,
      data: batchDto.data,
      reason: batchDto.reason
    });
  }

  @Post('vacation/:vacationId/handle-substitutions')
  @ApiOperation({ 
    summary: 'Обрабатывает замещения при отпуске',
    description: 'Автоматически назначает замещения или отменяет занятия при отпуске преподавателя'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Замещения обработаны',
    type: VacationSubstitutionResultDto
  })
  async handleVacationSubstitutions(
    @Param('vacationId', ParseIntPipe) vacationId: number
  ): Promise<VacationSubstitutionResultDto> {
    return this.scheduleManagementService.handleVacationSubstitutions(vacationId);
  }

  @Get('batch/:batchId/status')
  @ApiOperation({ 
    summary: 'Получает статус массовой операции',
    description: 'Возвращает информацию о выполнении массовой операции'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Статус операции получен',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        operation: { type: 'string' },
        description: { type: 'string' },
        totalItems: { type: 'number' },
        processedItems: { type: 'number' },
        failedItems: { type: 'number' },
        status: { type: 'string', enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'] },
        errors: { type: 'object' },
        startedAt: { type: 'string', format: 'date-time' },
        completedAt: { type: 'string', format: 'date-time' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  async getBatchOperationStatus(@Param('batchId') batchId: string) {
    // Здесь мы получаем статус из базы данных
    return await this.scheduleManagementService['prisma'].scheduleBatch.findUnique({
      where: { id: batchId }
    });
  }

  @Get('conflicts/:scheduleId')
  @ApiOperation({ 
    summary: 'Получает конфликты для конкретного расписания',
    description: 'Возвращает все активные конфликты для указанного расписания'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Конфликты получены',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          type: { type: 'string' },
          description: { type: 'string' },
          severity: { type: 'number' },
          isResolved: { type: 'boolean' },
          resolvedAt: { type: 'string', format: 'date-time' },
          resolution: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      }
    }
  })
  async getScheduleConflicts(@Param('scheduleId') scheduleId: string) {
    return await this.scheduleManagementService['prisma'].scheduleConflict.findMany({
      where: { 
        scheduleId,
        isResolved: false 
      },
      orderBy: [
        { severity: 'desc' },
        { createdAt: 'desc' }
      ]
    });
  }

  @Post('conflicts/:conflictId/resolve')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Помечает конфликт как решенный',
    description: 'Отмечает конфликт расписания как решенный с указанием способа решения'
  })
  @ApiResponse({ 
    status: 204, 
    description: 'Конфликт помечен как решенный'
  })
  async resolveConflict(
    @Param('conflictId') conflictId: string,
    @Body() body: { resolution: string; resolvedBy?: string }
  ) {
    await this.scheduleManagementService['prisma'].scheduleConflict.update({
      where: { id: conflictId },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
        resolvedBy: body.resolvedBy,
        resolution: body.resolution
      }
    });
  }

  @Get('analytics/optimization')
  @ApiOperation({ 
    summary: 'Получает аналитику оптимизации расписания',
    description: 'Возвращает статистику по использованию AI-оптимизации и эффективности'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Аналитика получена',
    schema: {
      type: 'object',
      properties: {
        totalAiGeneratedSchedules: { type: 'number' },
        averageConfidence: { type: 'number' },
        resolvedConflicts: { type: 'number' },
        activeConflicts: { type: 'number' },
        classroomUtilization: { type: 'object' },
        teacherWorkload: { type: 'object' },
        optimizationSuggestions: { type: 'array' }
      }
    }
  })
  async getOptimizationAnalytics() {
    const [
      totalAiSchedules,
      avgConfidence,
      resolvedConflicts,
      activeConflicts,
      classroomStats,
      recentSuggestions
    ] = await Promise.all([
      // Общее количество AI-сгенерированных расписаний
      this.scheduleManagementService['prisma'].schedule.count({
        where: { isAiGenerated: true }
      }),
      
      // Средняя уверенность AI
      this.scheduleManagementService['prisma'].schedule.aggregate({
        where: { 
          isAiGenerated: true,
          aiConfidence: { not: null }
        },
        _avg: { aiConfidence: true }
      }),
      
      // Решенные конфликты
      this.scheduleManagementService['prisma'].scheduleConflict.count({
        where: { isResolved: true }
      }),
      
      // Активные конфликты
      this.scheduleManagementService['prisma'].scheduleConflict.count({
        where: { isResolved: false }
      }),
      
      // Статистика использования аудиторий
      this.scheduleManagementService['prisma'].schedule.groupBy({
        by: ['classroomId'],
        where: {
          classroomId: { not: null },
          date: {
            gte: new Date(new Date().setDate(new Date().getDate() - 30))
          }
        },
        _count: { id: true }
      }),
      
      // Недавние предложения по оптимизации
      this.scheduleManagementService['prisma'].schedule.findMany({
        where: {
          aiSuggestions: { not: null },
          createdAt: {
            gte: new Date(new Date().setDate(new Date().getDate() - 7))
          }
        },
        select: { 
          id: true, 
          aiSuggestions: true, 
          aiConfidence: true,
          createdAt: true
        },
        take: 10,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    return {
      totalAiGeneratedSchedules: totalAiSchedules,
      averageConfidence: avgConfidence._avg.aiConfidence || 0,
      resolvedConflicts,
      activeConflicts,
      classroomUtilization: classroomStats.reduce((acc, stat) => {
        acc[stat.classroomId || 'unassigned'] = stat._count.id;
        return acc;
      }, {} as Record<string, number>),
      recentOptimizations: recentSuggestions
    };
  }
}
