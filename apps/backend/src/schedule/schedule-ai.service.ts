import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { 
  ScheduleType, 
  ScheduleStatus, 
  ConflictType,
  ScheduleTemplate,
  Schedule,
  Classroom,
  Teacher,
  StudyPlan,
  Group,
  Lesson
} from '../../generated/prisma';

export interface ScheduleGenerationParams {
  studyPlanId: number;
  groupId: number;
  teacherId: number;
  startDate: Date;
  endDate: Date;
  preferredTimes?: string[]; // ["09:00", "10:30", "14:00"]
  excludedDates?: Date[];
  preferredClassrooms?: number[];
  maxLessonsPerDay?: number;
  minBreakBetweenLessons?: number; // минуты
}

export interface ScheduleOptimizationResult {
  schedules: Partial<Schedule>[];
  conflicts: ConflictSummary[];
  suggestions: OptimizationSuggestion[];
  confidence: number; // 0-1
}

export interface ConflictSummary {
  type: ConflictType;
  description: string;
  severity: number;
  affectedSchedules: string[];
  suggestedResolution?: string;
}

export interface OptimizationSuggestion {
  type: 'CLASSROOM_CHANGE' | 'TIME_CHANGE' | 'DATE_CHANGE' | 'TEACHER_SUBSTITUTE';
  description: string;
  priority: number;
  scheduleId: string;
  suggestedValue?: any;
}

@Injectable()
export class ScheduleAiService {
  private readonly logger = new Logger(ScheduleAiService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Генерирует оптимизированное расписание на основе уроков
   */
  async generateOptimizedSchedule(
    params: ScheduleGenerationParams
  ): Promise<ScheduleOptimizationResult> {
    this.logger.log(`Generating schedule for study plan ${params.studyPlanId}`);

    try {
      // 1. Получаем данные
      const [studyPlan, group, teacher, lessons, classrooms] = await Promise.all([
        this.getStudyPlan(params.studyPlanId),
        this.getGroup(params.groupId),
        this.getTeacher(params.teacherId),
        this.getLessonsForPlan(params.studyPlanId),
        this.getAvailableClassrooms()
      ]);

      // 2. Получаем существующие расписания для проверки конфликтов
      const existingSchedules = await this.getExistingSchedules(
        params.startDate,
        params.endDate
      );

      // 3. Генерируем временные слоты
      const timeSlots = this.generateTimeSlots(
        params.startDate,
        params.endDate,
        params.preferredTimes,
        params.excludedDates
      );

      // 4. Для каждого урока подбираем оптимальное время и аудиторию
      const schedules: Partial<Schedule>[] = [];
      const conflicts: ConflictSummary[] = [];
      const suggestions: OptimizationSuggestion[] = [];

      for (const lesson of lessons) {
        const scheduleResult = await this.optimizeLessonSchedule(
          lesson,
          timeSlots,
          classrooms,
          existingSchedules,
          schedules,
          params
        );

        if (scheduleResult.schedule) {
          schedules.push(scheduleResult.schedule);
        }

        conflicts.push(...scheduleResult.conflicts);
        suggestions.push(...scheduleResult.suggestions);
      }

      // 5. Вычисляем общую уверенность в расписании
      const confidence = this.calculateConfidence(schedules, conflicts);

      // 6. Добавляем общие рекомендации
      const globalSuggestions = this.generateGlobalSuggestions(
        schedules,
        conflicts,
        classrooms
      );

      return {
        schedules,
        conflicts,
        suggestions: [...suggestions, ...globalSuggestions],
        confidence
      };

    } catch (error) {
      this.logger.error('Error generating schedule:', error);
      throw error;
    }
  }

  /**
   * Проверяет конфликты расписания
   */
  async detectScheduleConflicts(
    scheduleDate: Date,
    startTime: string,
    endTime: string,
    teacherId: number,
    classroomId?: number,
    groupId?: number,
    excludeScheduleId?: string
  ): Promise<ConflictSummary[]> {
    const conflicts: ConflictSummary[] = [];

    // Проверяем конфликты преподавателя
    const teacherConflicts = await this.prisma.schedule.findMany({
      where: {
        teacherId,
        date: scheduleDate,
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } }
            ]
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } }
            ]
          }
        ],
        id: excludeScheduleId ? { not: excludeScheduleId } : undefined,
        status: { not: 'CANCELLED' }
      },
      include: { teacher: { include: { user: true } } }
    });

    if (teacherConflicts.length > 0) {
      conflicts.push({
        type: ConflictType.TEACHER_BUSY,
        description: `Преподаватель ${teacherConflicts[0].teacher.user.name} уже занят в это время`,
        severity: 3,
        affectedSchedules: teacherConflicts.map(s => s.id),
        suggestedResolution: 'Выберите другое время или назначьте замещающего преподавателя'
      });
    }

    // Проверяем конфликты аудитории
    if (classroomId) {
      const classroomConflicts = await this.prisma.schedule.findMany({
        where: {
          classroomId,
          date: scheduleDate,
          OR: [
            {
              AND: [
                { startTime: { lte: startTime } },
                { endTime: { gt: startTime } }
              ]
            },
            {
              AND: [
                { startTime: { lt: endTime } },
                { endTime: { gte: endTime } }
              ]
            }
          ],
          id: excludeScheduleId ? { not: excludeScheduleId } : undefined,
          status: { not: 'CANCELLED' }
        },
        include: { classroom: true }
      });

      if (classroomConflicts.length > 0) {
        conflicts.push({
          type: ConflictType.CLASSROOM_BUSY,
          description: `Аудитория ${classroomConflicts[0].classroom?.name} уже занята`,
          severity: 2,
          affectedSchedules: classroomConflicts.map(s => s.id),
          suggestedResolution: 'Выберите другую аудиторию или время'
        });
      }
    }

    // Проверяем конфликты группы
    if (groupId) {
      const groupConflicts = await this.prisma.schedule.findMany({
        where: {
          groupId,
          date: scheduleDate,
          OR: [
            {
              AND: [
                { startTime: { lte: startTime } },
                { endTime: { gt: startTime } }
              ]
            },
            {
              AND: [
                { startTime: { lt: endTime } },
                { endTime: { gte: endTime } }
              ]
            }
          ],
          id: excludeScheduleId ? { not: excludeScheduleId } : undefined,
          status: { not: 'CANCELLED' }
        },
        include: { group: true }
      });

      if (groupConflicts.length > 0) {
        conflicts.push({
          type: ConflictType.STUDENT_GROUP_BUSY,
          description: `Группа ${groupConflicts[0].group.name} уже имеет занятие в это время`,
          severity: 3,
          affectedSchedules: groupConflicts.map(s => s.id),
          suggestedResolution: 'Выберите другое время'
        });
      }
    }

    // Проверяем отпуска преподавателя
    const vacationConflicts = await this.prisma.vacation.findMany({
      where: {
        teacherId,
        status: 'approved',
        startDate: { lte: scheduleDate },
        endDate: { gte: scheduleDate }
      },
      include: { teacher: { include: { user: true } } }
    });

    if (vacationConflicts.length > 0) {
      conflicts.push({
        type: ConflictType.VACATION_CONFLICT,
        description: `Преподаватель ${vacationConflicts[0].teacher.user.name} в отпуске`,
        severity: 3,
        affectedSchedules: [],
        suggestedResolution: 'Назначьте замещающего преподавателя'
      });
    }

    return conflicts;
  }

  /**
   * Подбирает оптимальную аудиторию для урока
   */
  async suggestOptimalClassroom(
    lessonType: string,
    groupSize: number,
    date: Date,
    startTime: string,
    endTime: string,
    preferredClassrooms?: number[]
  ): Promise<{ classroom: Classroom; confidence: number }[]> {
    let classrooms = await this.prisma.classroom.findMany({
      where: {
        deletedAt: null,
        ...(preferredClassrooms && { id: { in: preferredClassrooms } })
      }
    });

    // Исключаем занятые аудитории
    const busyClassrooms = await this.prisma.schedule.findMany({
      where: {
        date,
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } }
            ]
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } }
            ]
          }
        ],
        status: { not: 'CANCELLED' },
        classroomId: { not: null }
      },
      select: { classroomId: true }
    });

    const busyClassroomIds = busyClassrooms
      .map(s => s.classroomId)
      .filter(id => id !== null);

    classrooms = classrooms.filter(c => !busyClassroomIds.includes(c.id));

    // Оцениваем каждую аудиторию
    const suggestions = classrooms.map(classroom => {
      let confidence = 0.5; // базовая уверенность

      // Проверяем вместимость
      if (classroom.capacity >= groupSize) {
        confidence += 0.3;
        if (classroom.capacity <= groupSize * 1.2) {
          confidence += 0.1; // бонус за оптимальный размер
        }
      } else {
        confidence -= 0.4; // штраф за недостаточную вместимость
      }

      // Проверяем тип аудитории
      const typeMatch = this.checkClassroomTypeMatch(lessonType, classroom.type);
      confidence += typeMatch * 0.2;

      // Проверяем оборудование
      const equipmentMatch = this.checkEquipmentMatch(lessonType, classroom.equipment);
      confidence += equipmentMatch * 0.1;

      // Проверяем предпочтения
      if (preferredClassrooms && preferredClassrooms.includes(classroom.id)) {
        confidence += 0.1;
      }

      return {
        classroom,
        confidence: Math.min(1, Math.max(0, confidence))
      };
    });

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  // Приватные методы

  private async getStudyPlan(id: number) {
    return this.prisma.studyPlan.findUnique({
      where: { id },
      include: { teacher: { include: { user: true } } }
    });
  }

  private async getGroup(id: number) {
    return this.prisma.group.findUnique({
      where: { id },
      include: { students: true }
    });
  }

  private async getTeacher(id: number) {
    return this.prisma.teacher.findUnique({
      where: { id },
      include: { user: true }
    });
  }

  private async getLessonsForPlan(studyPlanId: number) {
    return this.prisma.lesson.findMany({
      where: { 
        studyPlanId,
        deletedAt: null
      },
      orderBy: { date: 'asc' }
    });
  }

  private async getAvailableClassrooms() {
    return this.prisma.classroom.findMany({
      where: { deletedAt: null }
    });
  }

  private async getExistingSchedules(startDate: Date, endDate: Date) {
    return this.prisma.schedule.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        },
        status: { not: 'CANCELLED' },
        deletedAt: null
      },
      include: {
        teacher: { include: { user: true } },
        classroom: true,
        group: true
      }
    });
  }

  private generateTimeSlots(
    startDate: Date,
    endDate: Date,
    preferredTimes?: string[],
    excludedDates?: Date[]
  ) {
    const slots = [];
    const defaultTimes = ['09:00', '10:30', '12:00', '13:30', '15:00', '16:30'];
    const times = preferredTimes || defaultTimes;

    const current = new Date(startDate);
    while (current <= endDate) {
      if (!excludedDates?.some(date => 
        date.toDateString() === current.toDateString()
      )) {
        // Пропускаем выходные (суббота = 6, воскресенье = 0)
        if (current.getDay() !== 0 && current.getDay() !== 6) {
          times.forEach(time => {
            slots.push({
              date: new Date(current),
              startTime: time,
              endTime: this.addMinutesToTime(time, 90) // 1.5 часа урок
            });
          });
        }
      }
      current.setDate(current.getDate() + 1);
    }

    return slots;
  }

  private async optimizeLessonSchedule(
    lesson: Lesson,
    timeSlots: any[],
    classrooms: Classroom[],
    existingSchedules: any[],
    currentSchedules: Partial<Schedule>[],
    params: ScheduleGenerationParams
  ) {
    const conflicts: ConflictSummary[] = [];
    const suggestions: OptimizationSuggestion[] = [];

    // Фильтруем слоты, близкие к дате урока
    const targetDate = new Date(lesson.date);
    const availableSlots = timeSlots.filter(slot => {
      const diff = Math.abs(slot.date.getTime() - targetDate.getTime());
      return diff <= 7 * 24 * 60 * 60 * 1000; // в пределах недели
    });

    // Пытаемся найти оптимальный слот
    for (const slot of availableSlots) {
      const slotConflicts = await this.detectScheduleConflicts(
        slot.date,
        slot.startTime,
        slot.endTime,
        params.teacherId,
        undefined,
        params.groupId
      );

      if (slotConflicts.length === 0) {
        // Подбираем аудиторию
        const classroomSuggestions = await this.suggestOptimalClassroom(
          lesson.name,
          20, // примерный размер группы, можно получить из данных
          slot.date,
          slot.startTime,
          slot.endTime,
          params.preferredClassrooms
        );

        const bestClassroom = classroomSuggestions[0]?.classroom;

        const schedule: Partial<Schedule> = {
          studyPlanId: params.studyPlanId,
          groupId: params.groupId,
          teacherId: params.teacherId,
          classroomId: bestClassroom?.id,
          lessonId: lesson.id,
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          dayOfWeek: slot.date.getDay(),
          type: ScheduleType.REGULAR,
          status: ScheduleStatus.SCHEDULED,
          isAiGenerated: true,
          aiConfidence: classroomSuggestions[0]?.confidence || 0.5
        };

        return {
          schedule,
          conflicts: [],
          suggestions: []
        };
      } else {
        conflicts.push(...slotConflicts);
      }
    }

    // Если не нашли идеальный слот, возвращаем конфликты и предложения
    suggestions.push({
      type: 'TIME_CHANGE',
      description: `Не удалось найти свободное время для урока "${lesson.name}"`,
      priority: 3,
      scheduleId: '',
      suggestedValue: availableSlots[0]
    });

    return {
      schedule: null,
      conflicts,
      suggestions
    };
  }

  private calculateConfidence(
    schedules: Partial<Schedule>[],
    conflicts: ConflictSummary[]
  ): number {
    if (schedules.length === 0) return 0;

    const totalLessons = schedules.length;
    const scheduledLessons = schedules.filter(s => s.classroomId).length;
    const highSeverityConflicts = conflicts.filter(c => c.severity >= 3).length;

    let confidence = scheduledLessons / totalLessons;
    confidence -= (highSeverityConflicts * 0.1);

    return Math.max(0, Math.min(1, confidence));
  }

  private generateGlobalSuggestions(
    schedules: Partial<Schedule>[],
    conflicts: ConflictSummary[],
    classrooms: Classroom[]
  ): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // Анализируем загруженность аудиторий
    const classroomUsage = new Map<number, number>();
    schedules.forEach(s => {
      if (s.classroomId) {
        classroomUsage.set(s.classroomId, (classroomUsage.get(s.classroomId) || 0) + 1);
      }
    });

    // Предлагаем альтернативы для перегруженных аудиторий
    classroomUsage.forEach((usage, classroomId) => {
      if (usage > 5) { // если аудитория используется более 5 раз
        const classroom = classrooms.find(c => c.id === classroomId);
        suggestions.push({
          type: 'CLASSROOM_CHANGE',
          description: `Аудитория ${classroom?.name} перегружена (${usage} занятий)`,
          priority: 2,
          scheduleId: '',
          suggestedValue: 'Рассмотрите распределение занятий по другим аудиториям'
        });
      }
    });

    return suggestions;
  }

  private addMinutesToTime(time: string, minutes: number): string {
    const [hours, mins] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, mins + minutes, 0, 0);
    
    return date.toTimeString().slice(0, 5);
  }

  private checkClassroomTypeMatch(lessonType: string, classroomType: string): number {
    const typeMapping: Record<string, string[]> = {
      'LECTURE': ['LECTURE'],
      'PRACTICE': ['PRACTICE', 'LECTURE'],
      'COMPUTER': ['COMPUTER'],
      'LABORATORY': ['LABORATORY'],
      'OTHER': ['OTHER', 'LECTURE', 'PRACTICE']
    };

    const lessonKey = lessonType.toUpperCase();
    const suitableTypes = typeMapping[lessonKey] || ['OTHER'];
    
    return suitableTypes.includes(classroomType) ? 1 : 0;
  }

  private checkEquipmentMatch(lessonType: string, equipment: string[]): number {
    const requiredEquipment: Record<string, string[]> = {
      'COMPUTER': ['computers', 'projector'],
      'PRESENTATION': ['projector', 'screen'],
      'LABORATORY': ['laboratory_equipment'],
      'MUSIC': ['piano', 'sound_system']
    };

    const lessonKey = lessonType.toUpperCase();
    const required = requiredEquipment[lessonKey] || [];
    
    if (required.length === 0) return 1;
    
    const matches = required.filter(req => 
      equipment.some(eq => eq.toLowerCase().includes(req.toLowerCase()))
    );
    
    return matches.length / required.length;
  }
}
