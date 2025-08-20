import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiAssistantService } from '../ai-assistant/ai-assistant.service';
import { GenerateScheduleDto } from '../ai-assistant/dto/generate-schedule.dto';

/**
 * Новый поток AI генерации расписания:
 * 1. heuristicDraft: строит черновик локально (без AI) с базовыми правилами
 * 2. aiOptimize: отправляет черновик + контекст в OpenAI для оптимизации и заполнения метрик
 * 3. validateConflicts: локальная проверка конфликтов перед применением
 * 4. apply: сохранение в БД
 */
@Injectable()
export class ScheduleAiFlowService {
  private readonly logger = new Logger(ScheduleAiFlowService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiAssistantService
  ) {}

  async heuristicDraft(params: GenerateScheduleDto) {
    // Собираем контекст (группы с размерами)
    const groups = await this.prisma.group.findMany({
      where: { id: { in: params.groupIds } },
      include: { students: true }
    });

    const studyPlans = await this.prisma.studyPlan.findMany({
      where: params.subjectIds?.length ? { id: { in: params.subjectIds }, deletedAt: null } : { deletedAt: null },
      include: { teacher: { include: { user: true } }, group: true }
    });

    // Доступные аудитории
    const classrooms = await this.prisma.classroom.findMany({ where: { deletedAt: null } });

    // Карта размеров групп
    const groupSizeMap = new Map<number, number>();
    groups.forEach(g => groupSizeMap.set(g.id, g.students.length));

    interface OccupySlot { teachers:Set<number>; groups:Set<number>; rooms:Set<number>; }
    const occupancy = new Map<string, Map<string, OccupySlot>>();
    const reserve = (date: string, start: string, end: string, teacherId: number, groupId: number, roomId?: number) => {
      const keyTime = `${start}-${end}`;
      if (!occupancy.has(date)) occupancy.set(date, new Map());
      const dayMap = occupancy.get(date);
      if (!dayMap.has(keyTime)) dayMap.set(keyTime, { teachers: new Set(), groups: new Set(), rooms: new Set() });
      const slot = dayMap.get(keyTime);
      slot.teachers.add(teacherId);
      slot.groups.add(groupId);
      if (roomId) slot.rooms.add(roomId);
    };
    const hasConflict = (date: string, start: string, end: string, teacherId: number, groupId: number, roomId?: number) => {
      const keyTime = `${start}-${end}`;
      const dayMap = occupancy.get(date);
      if (!dayMap) return false;
      const slot = dayMap.get(keyTime);
      if (!slot) return false;
      return slot.teachers.has(teacherId) || slot.groups.has(groupId) || (roomId ? slot.rooms.has(roomId) : false);
    };
    const pickClassroom = (subject: string, groupSize: number, date: string, start: string, end: string) => {
      const subj = subject.toUpperCase();
      const preferred: string[] = [];
      if (/ИНФОРМ|ПРОГРАМ|COMPUT|IT/.test(subj)) preferred.push('COMPUTER_LAB');
      if (/ФИЗИК|ХИМИ|LAB|ЛАБ/.test(subj)) preferred.push('LABORATORY');
      if (/ЛЕКЦ|THEOR|ТЕОР/.test(subj)) preferred.push('LECTURE_HALL');
      if (/СЕМИН|ДИСК/.test(subj)) preferred.push('SEMINAR_ROOM');
      if (/СПОРТ|ФИЗКУЛ|PE|GYM/.test(subj)) preferred.push('GYMNASIUM');
      if (/ПРАКТИК|WORK|МАСТЕР/.test(subj)) preferred.push('WORKSHOP');
      if (preferred.length === 0) preferred.push('AUDITORIUM');
      return classrooms
        .filter(c => c.capacity >= groupSize)
        .map(c => {
          const typeScore = preferred.includes(c.type) ? 2 : (c.type === 'AUDITORIUM' ? 1 : 0);
          const sizeRatio = c.capacity / (groupSize || 1);
          const sizeScore = sizeRatio >= 1 && sizeRatio <= 1.5 ? 2 : sizeRatio <= 2 ? 1 : 0.3;
          const busyPenalty = hasConflict(date, start, end, -1, -1, c.id) ? -10 : 0;
          return { c, score: typeScore * 3 + sizeScore * 2 + busyPenalty };
        })
        .sort((a,b)=> b.score - a.score)[0]?.c;
    };

    // Простая сетка времени
    const start = new Date(params.startDate);
    const end = new Date(params.endDate);
    const workingStart = params.constraints.workingHours.start;
    const workingEnd = params.constraints.workingHours.end;

    const timeSlots = this.buildTimeSlots(workingStart, workingEnd, 90); // 90 мин пары

    const draft: any[] = [];

  for (const sp of studyPlans) {
      // Кол-во недель в периоде
      const weeks = this.diffWeeks(start, end);
  const weeklyHours = (sp as any).hoursPerWeek || 2; // fallback если поля нет
  const totalPairs = weeklyHours * weeks;
      let placed = 0;
  const cursor = new Date(start);
      while (cursor <= end && placed < totalPairs) {
        if (this.isWorkingDay(cursor, params.constraints.excludeWeekends)) {
          for (const slot of timeSlots) {
            if (placed >= totalPairs) break;
            const slotStart = slot.start;
            const slotEnd = slot.end;
            // эвристика: избегаем более maxConsecutiveHours подряд для группы
            if (this.wouldExceedConsecutive(draft, sp.group.map(g=>g.id), cursor, slotStart, params.constraints.maxConsecutiveHours)) continue;

            // проверяем базовые конфликты (учитель / аудитория позже) сейчас пропускаем аудитории
            const teacherId = sp.teacherId;
            if (this.hasTeacherConflict(draft, teacherId, cursor, slotStart, slotEnd)) continue;

            const groupId = sp.group[0]?.id;
            if (!groupId) continue;
            const dateStr = cursor.toISOString().split('T')[0];
            const groupSize = groupSizeMap.get(groupId) || 0;
            const classroom = pickClassroom(sp.name, groupSize, dateStr, slotStart, slotEnd);
            if (classroom && hasConflict(dateStr, slotStart, slotEnd, sp.teacherId, groupId, classroom.id)) continue;
            draft.push({
              tempId: `${sp.id}-${placed}`,
              studyPlanId: sp.id,
              teacherId: sp.teacherId,
              teacherName: `${sp.teacher.user.name} ${sp.teacher.user.surname}`,
              groupId,
              groupName: sp.group[0]?.name,
              subject: sp.name,
              date: cursor.toISOString().split('T')[0],
              day: this.dayName(cursor),
              startTime: slotStart,
              endTime: slotEnd,
              roomId: classroom?.id?.toString() || '',
              roomType: classroom?.type || '',
              roomCapacity: classroom?.capacity,
              groupSize,
              status: 'upcoming',
              type: 'lesson',
              repeat: 'once'
            });
            reserve(dateStr, slotStart, slotEnd, sp.teacherId, groupId, classroom?.id);
            placed++;
          }
        }
        cursor.setDate(cursor.getDate() + 1);
      }
    }

  return { draft, stats: { draftCount: draft.length, classroomsAssigned: draft.filter(d=>d.roomId).length } };
  }

  async aiOptimize(draft: any[], params: GenerateScheduleDto) {
    return this.ai.optimizeScheduleDraft(draft, {
      startDate: params.startDate,
      endDate: params.endDate,
      workingHours: params.constraints.workingHours,
      maxConsecutiveHours: params.constraints.maxConsecutiveHours
    });
  }

  async validateConflicts(generated: any) {
    const conflicts: any[] = [];
    const byKey = new Map<string, any[]>();
  for (const item of (generated.generatedSchedule || [])) {
      const keyTeacher = `T:${item.teacherId}:${item.date}:${item.startTime}`;
      this.pushKey(byKey, keyTeacher, item);
      const keyGroup = `G:${item.groupId}:${item.date}:${item.startTime}`;
      this.pushKey(byKey, keyGroup, item);
      const keyRoom = `R:${item.roomId}:${item.date}:${item.startTime}`;
      this.pushKey(byKey, keyRoom, item);
    }
    for (const [k, arr] of byKey.entries()) {
      if (arr.length > 1) {
        conflicts.push({ type: 'overlap', key: k, count: arr.length, items: arr.map(i=>i.subject) });
      }
    }
  return Promise.resolve({ conflicts, isOk: conflicts.length === 0 });
  }

  async apply(generated: any) {
    const created: any[] = [];
  for (const item of (generated.generatedSchedule || [])) {
      try {
        if (!item.groupId || !item.teacherId) continue;
  const dateStr: string = String(item.date);
  const dayOfWeek = this.dayNum(new Date(dateStr));
        const studyPlan = await this.prisma.studyPlan.findFirst({ where: { name: item.subject } });
        if (!studyPlan) continue;
        const schedule = await this.prisma.schedule.create({
          data: {
            studyPlanId: studyPlan.id,
            groupId: Number(item.groupId),
            teacherId: Number(item.teacherId),
            classroomId: item.roomId ? Number(item.roomId) : undefined,
            dayOfWeek: dayOfWeek === 0 ? 7 : dayOfWeek,
            startTime: item.startTime,
            endTime: item.endTime,
            date: item.date ? new Date(String(item.date)) : undefined,
            type: 'REGULAR',
            status: 'SCHEDULED',
            isAiGenerated: true,
            aiConfidence: generated.confidence || 0
          }
        });
        created.push(schedule);
      } catch (e) {
        this.logger.warn('Skip schedule item', e);
      }
    }
    return { createdCount: created.length, created };
  }

  // Helpers
  private buildTimeSlots(start: string, end: string, durationMin: number) {
    const slots: { start: string; end: string }[] = [];
    const toMinutes = (t: string) => { const [h,m]=t.split(':').map(Number); return h*60+m; };
    const fromMinutes = (m: number) => `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
    let cur = toMinutes(start);
    const endMin = toMinutes(end);
    while (cur + durationMin <= endMin) {
      slots.push({ start: fromMinutes(cur), end: fromMinutes(cur + durationMin) });
      cur += durationMin; // без учёта перемен пока
    }
    return slots;
  }
  private diffWeeks(a: Date, b: Date) { return Math.max(1, Math.ceil((b.getTime()-a.getTime())/ (7*24*3600*1000))); }
  private isWorkingDay(d: Date, excludeWeekends?: boolean) { const dow=d.getDay(); return excludeWeekends ? (dow>=1 && dow<=5) : true; }
  private dayName(d: Date) { return ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][d.getDay()]; }
  private dayNum(d: Date) { return d.getDay(); }
  private hasTeacherConflict(draft: any[], teacherId: number, date: Date, startTime: string, endTime: string) {
    const dateStr = date.toISOString().split('T')[0];
    return draft.some(i => i.teacherId === teacherId && i.date === dateStr && !(i.endTime <= startTime || i.startTime >= endTime));
  }
  private wouldExceedConsecutive(draft: any[], groupIds: number[], date: Date, startTime: string, maxConsecutive: number) {
    if (!maxConsecutive) return false;
    const dateStr = date.toISOString().split('T')[0];
    const sameDay = draft
      .filter(i => groupIds.includes(Number(i.groupId)) && i.date === dateStr)
      .sort((a,b)=>String(a.startTime).localeCompare(String(b.startTime)));
    // Наивная проверка: если уже есть maxConsecutive занятий этот слот подряд
    return sameDay.length >= maxConsecutive; // упрощенно
  }
  private pushKey(map: Map<string, any[]>, key: string, value: any) { if (!map.has(key)) map.set(key, []); map.get(key)?.push(value); }
}
