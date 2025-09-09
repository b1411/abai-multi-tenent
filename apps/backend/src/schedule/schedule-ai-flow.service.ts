import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiAssistantService } from '../ai-assistant/ai-assistant.service';
import { GenerateScheduleDto } from '../ai-assistant/dto/generate-schedule.dto';
import { ScheduleOptimizerService, OptimizerParams } from './schedule-optimizer.service';

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
    private readonly ai: AiAssistantService,
    private readonly optimizer: ScheduleOptimizerService
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

  // Параметры длительности урока и перемены:
  // hoursPerWeek в доменной модели = количество 45-минутных уроков, НЕ 90-минутные пары
  const lessonDuration = Number((params as any)?.constraints?.lessonDuration ?? 45); // длительность урока (мин)
  const breakDuration = Number((params as any)?.constraints?.breakDuration ?? (params as any)?.constraints?.minBreakDuration ?? 10); // мин между уроками
  const maxLessonsPerDay = Number((params as any)?.constraints?.maxLessonsPerDay ?? 8);
  const lunchBreak = (params as any)?.constraints?.lunchBreakTime; // { start, end }
  const noFirstArr: string[] = ((params as any)?.constraints?.noFirstLessonSubjects || []) as string[];
  const noLastArr: string[] = ((params as any)?.constraints?.noLastLessonSubjects || []) as string[];
  const noFirst = new Set(noFirstArr.map(s=>String(s).toLowerCase()));
  const noLast = new Set(noLastArr.map(s=>String(s).toLowerCase()));
  const preferredDaysMap: Record<string, number[]> = (params as any)?.constraints?.preferredDays || {}; // subjectName -> [1..6]
  const customHolidays: string[] = (params as any)?.customHolidays || (params as any)?.constraints?.customHolidays || [];
  const holidaySet = new Set(customHolidays);

  // Сетка времени из отдельных уроков (а не 90-мин пар)
    const start = new Date(params.startDate);
    const end = new Date(params.endDate);
    const workingStart = params.constraints.workingHours.start;
    const workingEnd = params.constraints.workingHours.end;
  const timeSlots = this.buildTimeSlots(String(workingStart), String(workingEnd), Number(lessonDuration), Number(breakDuration));
  const firstSlotStart = timeSlots[0]?.start;
  const lastSlotStart = timeSlots[timeSlots.length-1]?.start;

    const draft: any[] = [];

  // Глобальный циклический указатель по дням недели, чтобы распределить старт
  let globalDayPointer = 0;
  // Учёт загрузки дней для каждой группы (для weeklyLessons=1 распределяем разные предметы по разным дням)
  const groupDayUsage: Map<number, Map<number, number>> = new Map(); // groupId -> (dow->count)
    const planDaySelection: Record<number, number[]> = {};
    for (const sp of studyPlans) {
      // Фильтруем только группы, которые реально выбраны пользователем
      const targetGroups = sp.group.filter(g => params.groupIds.includes(g.id));
      if (!targetGroups.length) continue;

      // Общие параметры для плана (применим к каждой группе отдельно)
      const weeks = this.diffWeeksAdjusted(start, end, params.constraints.excludeWeekends);
      const weeklyLessons: number = Number((params as any)?.subjectHours?.[sp.id] ?? (sp as any).hoursPerWeek ?? 2);
      const totalLessons = weeklyLessons * weeks;
      const allowedDows = params.constraints.excludeWeekends ? [1,2,3,4,5] : [1,2,3,4,5,6];
  const daysPerWeek = Math.max(1, Math.min(weeklyLessons, allowedDows.length));
      // Используем глобальный указатель для равномерного покрытия всех дней
      const rot = globalDayPointer % allowedDows.length;
      globalDayPointer = (globalDayPointer + 1) % allowedDows.length;
      const rotated = [...allowedDows.slice(rot), ...allowedDows.slice(0, rot)];
  let selectedDows = rotated.slice(0, daysPerWeek);
      planDaySelection[sp.id] = selectedDows;
      const perDayQuota = Math.max(1, Math.min(timeSlots.length, Math.ceil(weeklyLessons / selectedDows.length)));

      for (const grp of targetGroups) {
        // Равномерный выбор дней для этой группы на основе текущей загрузки (для всех weeklyLessons)
        let usage = groupDayUsage.get(grp.id);
        if (!usage) { usage = new Map(); groupDayUsage.set(grp.id, usage); }
        const neededDays = daysPerWeek;
  const dayCandidates = [...allowedDows].sort((a,b)=> (usage.get(a)||0) - (usage.get(b)||0));
        selectedDows = dayCandidates.slice(0, neededDays);
        let placed = 0;
        const cursor = new Date(start);
        const perWeekPlaced = new Map<number, number>();
        let slotCursor = ((Number(sp.id) + grp.id) % timeSlots.length) || 0;
        while (cursor <= end && placed < totalLessons) {
          const dateStr = cursor.toISOString().split('T')[0];
          if (holidaySet.has(dateStr)) { cursor.setDate(cursor.getDate()+1); continue; }
          if (this.isWorkingDay(cursor, params.constraints.excludeWeekends)) {
            const dow = cursor.getDay();
            const dowNormalized = dow === 0 ? 7 : dow;
            let placedTodayCount = 0;
            const rotatedSlots = timeSlots.length ? [...timeSlots.slice(slotCursor), ...timeSlots.slice(0, slotCursor)] : [];
            for (let idx=0; idx<rotatedSlots.length; idx++) {
              const slot = rotatedSlots[idx];
              if (!selectedDows.includes(dow)) break; // выходим ранно, этот день не в списке для плана
              if (placed >= totalLessons) break;
              if (placedTodayCount >= perDayQuota) break;
              const slotStart = slot.start;
              const slotEnd = slot.end;
              if (this.hasTeacherConflict(draft, sp.teacherId, cursor, slotStart, slotEnd)) continue;
              const groupId = grp.id;
              if (this.hasGroupConflict(draft, groupId, cursor, slotStart, slotEnd)) continue;
              const currentWeekIndex = Math.floor((cursor.getTime() - start.getTime()) / (7*24*3600*1000));
              if ((perWeekPlaced.get(currentWeekIndex) || 0) >= weeklyLessons) continue;
              if (this.countGroupDayLessons(draft, groupId, dateStr) >= maxLessonsPerDay) continue;
              const preferred = preferredDaysMap[sp.name];
              if (preferred && preferred.length && !preferred.includes(dowNormalized)) continue;
              if (noFirst.has(sp.name.toLowerCase()) && slotStart === firstSlotStart) continue;
              if (noLast.has(sp.name.toLowerCase()) && slotStart === lastSlotStart) continue;
              if (lunchBreak && this.intervalOverlap(String(slotStart), String(slotEnd), String(lunchBreak.start), String(lunchBreak.end))) continue;
              if (this.wouldExceedConsecutive(draft, [groupId], cursor, String(slotStart), String(slotEnd), Number(params.constraints.maxConsecutiveHours), Number(breakDuration))) continue;
              const groupSize = groupSizeMap.get(groupId) || 0;
              const classroom = pickClassroom(sp.name, groupSize, dateStr, slotStart, slotEnd);
              if (classroom && hasConflict(dateStr, slotStart, slotEnd, sp.teacherId, groupId, classroom.id)) continue;
              draft.push({
                tempId: `${sp.id}-${groupId}-${placed}`,
                studyPlanId: sp.id,
                teacherId: sp.teacherId,
                teacherName: `${sp.teacher.user.name} ${sp.teacher.user.surname}`,
                groupId,
                groupName: grp.name,
                subject: sp.name,
                date: dateStr,
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
              placedTodayCount++;
              placed++;
              perWeekPlaced.set(currentWeekIndex, (perWeekPlaced.get(currentWeekIndex) || 0) + 1);
              // учёт использования дня для weeklyLessons=1
              const dowNorm = dow === 0 ? 7 : dow;
              let usageLocal = groupDayUsage.get(groupId);
              if (!usageLocal) { usageLocal = new Map(); groupDayUsage.set(groupId, usageLocal); }
              usageLocal.set(dowNorm, (usageLocal.get(dowNorm) || 0) + 1);
            }
          }
          if (timeSlots.length) slotCursor = (slotCursor + 1) % timeSlots.length;
          cursor.setDate(cursor.getDate() + 1);
        }
      }
    }

    // --- Пост-распределение: выравниваем по дням недели внутри каждой недели для каждой группы ---
    try {
      const allowedDowsGlobal = params.constraints.excludeWeekends ? [1,2,3,4,5] : [1,2,3,4,5,6];
      const msWeek = 7*24*3600*1000;
      const startMs = start.getTime();
      const weeksTotal = this.diffWeeksAdjusted(start, end, params.constraints.excludeWeekends);
      const timeSlotStarts = timeSlots.map(s=>s.start);

      const findDateFor = (weekIdx: number, dow: number) => {
        const baseDate = new Date(startMs + weekIdx*msWeek);
        // move to Monday of that week
        const baseDow = baseDate.getDay() || 7; // 1..7
        const diff = dow - baseDow;
        baseDate.setDate(baseDate.getDate() + diff);
        return baseDate;
      };

      for (let w=0; w<weeksTotal; w++) {
        for (const g of groups) {
          const gId = g.id;
          // Уроки этой группы в неделе w
          const weekStart = new Date(startMs + w*msWeek);
          const weekEnd = new Date(weekStart.getTime() + 6*24*3600*1000);
          const weekLessons = draft.filter(l => l.groupId===gId && new Date(String(l.date)) >= weekStart && new Date(String(l.date)) <= weekEnd);
          if (!weekLessons.length) continue;
          const byDow = new Map<number, any[]>();
          for (const lesson of weekLessons) {
            const d = new Date(String(lesson.date));
            const dn = d.getDay() === 0 ? 7 : d.getDay();
            if (!byDow.has(dn)) byDow.set(dn, []);
            byDow.get(dn).push(lesson);
          }
          // Найти пустые дни и перегруженные
          const emptyDows = allowedDowsGlobal.filter(d => !byDow.has(d));
          if (!emptyDows.length) continue; // уже все дни заняты хотя бы одним
          // Доноры: дни с более чем 1 уроком
            const donorDows = Array.from(byDow.entries()).filter(([, arr])=>arr.length>1).sort((a,b)=>b[1].length - a[1].length);
          if (!donorDows.length) continue;
          for (const targetDow of emptyDows) {
            const donor = donorDows.find(dd => dd[1].length>1);
            if (!donor) break;
            const donorLessons = donor[1];
            // Возьмем последний (обычно более поздний) чтобы минимально ломать последовательность
            const moved = donorLessons.pop();
            if (!moved) continue;
            // Найти свободный слот в целевом дне подряд к началу
            const newDateObj = findDateFor(w, targetDow);
            const newDateStr = newDateObj.toISOString().split('T')[0];
            // Подберем первый слот без конфликтов
            for (const slotStart of timeSlotStarts) {
              const slot = timeSlots.find(s=>s.start===slotStart);
              if (!slot) continue;
              if (this.hasGroupConflict(draft.filter(l=>l!==moved), gId, newDateObj, slot.start, slot.end)) continue;
              if (this.hasTeacherConflict(draft.filter(l=>l!==moved), Number(moved.teacherId), newDateObj, slot.start, slot.end)) continue;
              // Переназначаем
              moved.date = newDateStr;
              moved.day = this.dayName(newDateObj);
              moved.startTime = slot.start;
              moved.endTime = slot.end;
              // Обновим донор/целевые структуры
              if (!byDow.has(targetDow)) byDow.set(targetDow, []);
              byDow.get(targetDow).push(moved);
              break;
            }
          }
        }
      }
    } catch (e) {
      this.logger.warn('Post-distribution balancing failed', e);
    }

    // --- Уплотнение внутри дня для каждой группы: сдвигаем уроки к началу дня без окон ---
    try {
      const daySlotsOrdered = timeSlots.map(s=>({start:s.start,end:s.end}));
      const byGroupDate = new Map<string, any[]>();
      for (const l of draft) {
        const key = `${l.groupId}|${l.date}`;
        if (!byGroupDate.has(key)) byGroupDate.set(key, []);
        byGroupDate.get(key).push(l);
      }
      for (const [, lessons] of byGroupDate) {
        if (lessons.length < 2) continue; // нечего уплотнять
        lessons.sort((a,b)=>String(a.startTime).localeCompare(String(b.startTime)));
        // Пробегаем по слотовому списку и назначаем последовательные слоты
        let slotIdx = 0;
        for (const lesson of lessons) {
          if (slotIdx >= daySlotsOrdered.length) break;
          const targetSlot = daySlotsOrdered[slotIdx];
          // Если уже на месте - оставляем
          if (lesson.startTime === targetSlot.start) { slotIdx++; continue; }
          const dateObj = new Date(String(lesson.date));
          // Проверка конфликтов (учитель / группа)
          if (this.hasTeacherConflict(draft.filter(x=>x!==lesson), Number(lesson.teacherId), dateObj, targetSlot.start, targetSlot.end)) {
            // Учитель занят — оставляем как есть и не двигаем дальше эту позицию (занимаем следующий слот)
            slotIdx++;
            continue;
          }
          if (this.hasGroupConflict(draft.filter(x=>x!==lesson), Number(lesson.groupId), dateObj, targetSlot.start, targetSlot.end)) {
            slotIdx++;
            continue;
          }
          // Смена аудитории при необходимости
          if (lesson.roomId) {
            // Т.к. мы не держим тут occupancy per room для новых позиций, просто сбросим roomId чтобы оптимизатор позже подобрал или оставим null
            lesson.roomId = '';
          }
          lesson.startTime = targetSlot.start;
          lesson.endTime = targetSlot.end;
          slotIdx++;
        }
      }
    } catch (e) {
      this.logger.warn('Per-group compression failed', e);
    }

    // Подсчёт ожидаемых и фактических уроков по группам для диагностики
    try {
      const expectedByGroup = new Map<number, number>();
      const weeks = this.diffWeeksAdjusted(start, end, params.constraints.excludeWeekends);
      for (const sp of studyPlans) {
        const wLessons: number = Number((params as any)?.subjectHours?.[sp.id] ?? (sp as any).hoursPerWeek ?? 2);
        for (const g of sp.group) {
          if (!params.groupIds.includes(g.id)) continue;
          expectedByGroup.set(g.id, (expectedByGroup.get(g.id)||0) + wLessons * weeks);
        }
      }
      const actualByGroup = new Map<number, number>();
  for (const l of draft) actualByGroup.set(Number(l.groupId), (actualByGroup.get(Number(l.groupId))||0)+1);
      for (const g of params.groupIds) {
        const exp = expectedByGroup.get(g) || 0;
        const act = actualByGroup.get(g) || 0;
        if (act < exp) {
          this.logger.warn(`GROUP_LESSONS_UNDERFILLED group=${g} expected=${exp} actual=${act}`);
        }
      }
    } catch (e) {
      this.logger.warn('Stats expectation calculation failed', e);
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

  async optimizeLocal(draft: any[], params: GenerateScheduleDto) {
    type DraftItem = {
      tempId?: string;
      studyPlanId?: number;
      teacherId: number;
      teacherName?: string;
      groupId: number;
      groupName?: string;
      subject: string;
      date: string;
      startTime: string;
      endTime: string;
      roomId?: string | number;
      roomType?: string;
      roomCapacity?: number;
      groupSize?: number;
      status?: string;
      type?: string;
      repeat?: string;
    };
    const mapped: OptimizerParams = {
      startDate: params.startDate,
      endDate: params.endDate,
      workingHours: params.constraints.workingHours,
      maxConsecutiveHours: params.constraints.maxConsecutiveHours,
  maxLessonsPerDay: (params as any)?.constraints?.maxLessonsPerDay,
      excludeWeekends: params.constraints.excludeWeekends,
      minBreakMinutes: (params as any)?.constraints?.minBreakDuration ?? 10,
  lessonDurationMinutes: 45, // синхронизировано с heuristicDraft
  breakMinutes: (params as any)?.constraints?.minBreakDuration ?? 10,
  holidays: (params as any)?.constraints?.customHolidays || (params as any)?.customHolidays || [],
  lunchBreakTime: (params as any)?.constraints?.lunchBreakTime,
      weights: (params as any)?.constraints?.weights,
  forceBiweeklyStudyPlanIds: (params as any)?.forceBiweeklyStudyPlanIds || [],
    };
    const typedDraft: DraftItem[] = draft.map(d => ({ ...d }));
  return this.optimizer.optimize(typedDraft, mapped);
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
    const templates = Array.isArray(generated.recurringTemplates) ? generated.recurringTemplates : [];
    const singles = Array.isArray(generated.singleOccurrences) ? generated.singleOccurrences : [];

    if (templates.length || singles.length) {
      this.logger.log(`APPLY: persisting ${templates.length} templates and ${singles.length} singles`);
      // Persist templates
      for (const tpl of templates) {
        try {
          if (!tpl.groupId || !tpl.teacherId || !tpl.dayOfWeek) continue;
          const studyPlanId = tpl.studyPlanId ? Number(tpl.studyPlanId) : undefined;
          let studyPlan = studyPlanId ? await this.prisma.studyPlan.findUnique({ where: { id: studyPlanId } }) : null;
          if (!studyPlan) {
            studyPlan = await this.prisma.studyPlan.findFirst({ where: { name: tpl.subject } });
          }
          if (!studyPlan) continue;
          const schedule = await this.prisma.schedule.create({
            data: {
              studyPlanId: studyPlan.id,
              groupId: Number(tpl.groupId),
              teacherId: Number(tpl.teacherId),
              classroomId: tpl.roomId ? Number(tpl.roomId) : undefined,
              dayOfWeek: tpl.dayOfWeek,
              startTime: tpl.startTime,
              endTime: tpl.endTime,
              startDate: tpl.startDate ? new Date(String(tpl.startDate)) : undefined,
              endDate: tpl.endDate ? new Date(String(tpl.endDate)) : undefined,
              repeat: tpl.repeat,
              isTemplate: true,
              excludedDates: (tpl.excludedDates || []).map((d: string) => new Date(d)),
              type: 'REGULAR',
              status: 'SCHEDULED',
              isAiGenerated: true,
              aiConfidence: generated.confidence || 0
            }
          });
          created.push(schedule);
        } catch (e) {
          this.logger.warn('Skip template item', e);
        }
      }
      // Persist singles
      for (const s of singles) {
        try {
          if (!s.groupId || !s.teacherId || !s.date) continue;
          const studyPlanId = s.studyPlanId ? Number(s.studyPlanId) : undefined;
          let studyPlan = studyPlanId ? await this.prisma.studyPlan.findUnique({ where: { id: studyPlanId } }) : null;
          if (!studyPlan) {
            studyPlan = await this.prisma.studyPlan.findFirst({ where: { name: s.subject } });
          }
          if (!studyPlan) continue;
          const dayOfWeek = this.dayNum(new Date(String(s.date)));
          const schedule = await this.prisma.schedule.create({
            data: {
              studyPlanId: studyPlan.id,
              groupId: Number(s.groupId),
              teacherId: Number(s.teacherId),
              classroomId: s.roomId ? Number(s.roomId) : undefined,
              dayOfWeek: dayOfWeek === 0 ? 7 : dayOfWeek,
              startTime: s.startTime,
              endTime: s.endTime,
              date: new Date(String(s.date)),
              repeat: 'once',
              isTemplate: false,
              excludedDates: [],
              type: 'REGULAR',
              status: 'SCHEDULED',
              isAiGenerated: true,
              aiConfidence: generated.confidence || 0
            }
          });
          created.push(schedule);
        } catch (e) {
          this.logger.warn('Skip single item', e);
        }
      }
      return { createdCount: created.length, created };
    }

    // Fallback: legacy flat records
    for (const item of (generated.generatedSchedule || [])) {
      try {
        if (!item.groupId || !item.teacherId) continue;
        const dateStr: string = String(item.date);
        const dayOfWeek = this.dayNum(new Date(dateStr));
        const studyPlanId = item.studyPlanId ? Number(item.studyPlanId) : undefined;
        let studyPlan = studyPlanId ? await this.prisma.studyPlan.findUnique({ where: { id: studyPlanId } }) : null;
        if (!studyPlan) {
          studyPlan = await this.prisma.studyPlan.findFirst({ where: { name: item.subject } });
        }
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
  private buildTimeSlots(start: string, end: string, lessonDuration: number, breakDuration: number) {
    const slots: { start: string; end: string }[] = [];
    const toMinutes = (t: string) => { const [h,m]=t.split(':').map(Number); return h*60+m; };
    const fromMinutes = (m: number) => `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
    let cur = toMinutes(start);
    const endMin = toMinutes(end);
    while (cur + lessonDuration <= endMin) {
      const lessonStart = cur;
      const lessonEnd = cur + lessonDuration;
      slots.push({ start: fromMinutes(lessonStart), end: fromMinutes(lessonEnd) });
      cur = lessonEnd + breakDuration; // добавляем перемену
    }
    return slots;
  }
  private diffWeeks(a: Date, b: Date) { return Math.max(1, Math.ceil((b.getTime()-a.getTime())/ (7*24*3600*1000))); }
  private diffWeeksAdjusted(a: Date, b: Date, excludeWeekends?: boolean) {
    // Подсчёт количества учебных недель более точно: считаем учебные дни и делим на число рабочих дней в неделе
    let days = 0;
    const cur = new Date(a);
    while (cur <= b) {
      const dow = cur.getDay();
      const working = excludeWeekends ? (dow>=1 && dow<=5) : (dow>=1 && dow<=6); // исключаем воскресенье
      if (working) days++;
      cur.setDate(cur.getDate()+1);
    }
    const divisor = excludeWeekends ? 5 : 6; // считаем субботу учебным днём если не excludeWeekends
    return Math.max(1, Math.ceil(days / divisor));
  }
  private isWorkingDay(d: Date, excludeWeekends?: boolean) { const dow=d.getDay(); return excludeWeekends ? (dow>=1 && dow<=5) : true; }
  private dayName(d: Date) { return ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][d.getDay()]; }
  private dayNum(d: Date) { return d.getDay(); }
  private hasTeacherConflict(draft: any[], teacherId: number, date: Date, startTime: string, endTime: string) {
    const dateStr = date.toISOString().split('T')[0];
    return draft.some(i => i.teacherId === teacherId && i.date === dateStr && !(i.endTime <= startTime || i.startTime >= endTime));
  }
  private hasGroupConflict(draft: any[], groupId: number, date: Date, startTime: string, endTime: string) {
    const dateStr = date.toISOString().split('T')[0];
    return draft.some(i => Number(i.groupId) === Number(groupId) && i.date === dateStr && !(i.endTime <= startTime || i.startTime >= endTime));
  }
  private wouldExceedConsecutive(draft: any[], groupIds: number[], date: Date, startTime: string, endTime: string, maxConsecutive: number, breakMinutes: number) {
    if (!maxConsecutive) return false;
    const dateStr = date.toISOString().split('T')[0];
    const sameDay = draft
      .filter(i => groupIds.includes(Number(i.groupId)) && i.date === dateStr)
      .sort((a,b)=>String(a.startTime).localeCompare(String(b.startTime)));

    // Вставляем виртуально новый слот и пересчитываем максимальную цепочку подряд без разрывов
    const augmented = [...sameDay, { startTime, endTime }].sort((a,b)=>String(a.startTime).localeCompare(String(b.startTime)));
    let longest = 1;
    let current = 1;
    for (let i=1;i<augmented.length;i++) {
      const prev = augmented[i-1];
      const cur = augmented[i];
  const gap = this.minutesBetween(String(prev.endTime), String(cur.startTime));
      if (gap <= breakMinutes) {
        current++;
        longest = Math.max(longest, current);
      } else {
        current = 1;
      }
      if (longest > maxConsecutive) return true;
    }
    return false;
  }
  private pushKey(map: Map<string, any[]>, key: string, value: any) { if (!map.has(key)) map.set(key, []); map.get(key)?.push(value); }
  private countGroupDayLessons(draft: any[], groupId: number, dateStr: string) {
    return draft.filter(i => Number(i.groupId)===Number(groupId) && i.date===dateStr).length;
  }
  private minutesBetween(aEnd: string, bStart: string) { const toMin = (t:string)=>{const [h,m]=t.split(':').map(Number);return h*60+m;}; return toMin(bStart)-toMin(aEnd); }
  private intervalOverlap(aStart:string,aEnd:string,bStart:string,bEnd:string) {
    return !(aEnd <= bStart || aStart >= bEnd);
  }
}
