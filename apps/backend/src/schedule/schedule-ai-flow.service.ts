// schedule-ai-flow.service.ts

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
  private readonly TZ = process.env.SCHEDULE_TZ || 'Asia/Almaty';

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
    const overlaps = (aStart:string,aEnd:string,bStart:string,bEnd:string) => !(aEnd <= bStart || aStart >= bEnd);
    const hasRoomConflictLoose = (date: string, start: string, end: string, roomId: number) => {
      const dayMap = occupancy.get(date);
      if (!dayMap) return false;
      for (const [key, slot] of dayMap.entries()) {
        const [s, e] = key.split('-');
        if (overlaps(String(s), String(e), String(start), String(end)) && slot.rooms.has(roomId)) return true;
      }
      return false;
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
      const targetGroups =
        params.groupIds?.length
          ? sp.group.filter(g => params.groupIds.includes(g.id))
          : sp.group; // ← fallback
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
      for (const grp of targetGroups) {
        // Пересчитываем квоту по дням уже для конкретной группы (selectedDows может быть переопределён ниже)
        // selectedDows будет переопределяться далее по groupDayUsage, поэтому вычислим perDayQuota после этого.
    // Равномерный выбор дней для этой группы на основе текущей загрузки (для всех weeklyLessons)
        let usage = groupDayUsage.get(grp.id);
        if (!usage) { usage = new Map(); groupDayUsage.set(grp.id, usage); }
        const neededDays = daysPerWeek;
  const dayCandidates = [...allowedDows].sort((a,b)=> (usage.get(a)||0) - (usage.get(b)||0));
        selectedDows = dayCandidates.slice(0, neededDays);
    const perDayQuota = Math.max(1, Math.min(timeSlots.length, Math.ceil(weeklyLessons / selectedDows.length)));
        let placed = 0;
        const cursor = new Date(start);
        const perWeekPlaced = new Map<number, number>();
        const baseSlotCursor = ((Number(sp.id) + grp.id) % timeSlots.length) || 0;
        let slotCursor = baseSlotCursor;
        while (cursor <= end && placed < totalLessons) {
          const dateStr = this.toLocalDateStr(cursor);
          if (holidaySet.has(dateStr)) { cursor.setDate(cursor.getDate()+1); continue; }
          if (this.isWorkingDay(cursor, params.constraints.excludeWeekends)) {
            // Сброс slotCursor по понедельникам для стабильности
            if (this.localWeekday(cursor) === 1) slotCursor = baseSlotCursor;
            const dowNormalized = this.localWeekday(cursor);
            let placedTodayCount = 0;
            const rotatedSlots = timeSlots.length ? [...timeSlots.slice(slotCursor), ...timeSlots.slice(0, slotCursor)] : [];
            for (let idx=0; idx<rotatedSlots.length; idx++) {
              const slot = rotatedSlots[idx];
              if (!selectedDows.includes(dowNormalized)) break; // выходим ранно, этот день не в списке для плана
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
              if (classroom && hasRoomConflictLoose(dateStr, slotStart, slotEnd, Number(classroom.id))) continue;
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
                roomId: classroom?.id ? Number(classroom.id) : undefined,
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
              const dowNorm = dowNormalized;
              let usageLocal = groupDayUsage.get(groupId);
              if (!usageLocal) { usageLocal = new Map(); groupDayUsage.set(groupId, usageLocal); }
              usageLocal.set(dowNorm, (usageLocal.get(dowNorm) || 0) + 1);
            }
          }
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
      const startOfWeekMon = (d:Date) => { const x = new Date(d); const dow = this.localWeekday(x); x.setDate(x.getDate() - (dow - 1)); x.setHours(0,0,0,0); return x; };
      const weekStartMs = startOfWeekMon(start).getTime();
      const findDateFor = (weekIdx: number, dow: number) => {
        const baseDate = new Date(weekStartMs + weekIdx*msWeek);
        const baseDow = this.localWeekday(baseDate); // 1..7
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
            const dn = this.localWeekday(d);
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
            const moved = donorLessons.pop();
            if (!moved) continue;
            const newDateObj = findDateFor(w, targetDow);
            const newDateStr = this.toLocalDateStr(newDateObj);
            // Skip holidays and non-working days
            if (holidaySet.has(newDateStr) || !this.isWorkingDay(newDateObj, params.constraints.excludeWeekends)) { donorLessons.push(moved); continue; }
            // Try to find a valid slot that satisfies all original constraints
            let assigned = false;
            for (const slotStart of timeSlotStarts) {
              const slot = timeSlots.find(s=>s.start===slotStart);
              if (!slot) continue;
              if (this.hasGroupConflict(draft.filter(l=>l!==moved), gId, newDateObj, slot.start, slot.end)) continue;
              if (this.hasTeacherConflict(draft.filter(l=>l!==moved), Number(moved.teacherId), newDateObj, slot.start, slot.end)) continue;
              // respect maxLessonsPerDay
              if (this.countGroupDayLessons(draft.filter(l=>l!==moved), gId, newDateStr) >= maxLessonsPerDay) continue;
              // lunch break
              if (lunchBreak && this.intervalOverlap(String(slot.start), String(slot.end), String(lunchBreak.start), String(lunchBreak.end))) continue;
              // noFirst/noLast
              if (noFirst.has(String(moved.subject).toLowerCase()) && slot.start === firstSlotStart) continue;
              if (noLast.has(String(moved.subject).toLowerCase()) && slot.start === lastSlotStart) continue;
              // preferred days for subject
              const subjPref = preferredDaysMap[moved.subject];
              const dowNorm = this.localWeekday(newDateObj);
              if (subjPref && subjPref.length && !subjPref.includes(dowNorm)) continue;
              // consecutive hours
              if (this.wouldExceedConsecutive(draft.filter(l=>l!==moved), [gId], newDateObj, String(slot.start), String(slot.end), Number(params.constraints.maxConsecutiveHours), Number(breakDuration))) continue;
              // room handling: if original had room, try to keep it but check conflicts
              const origRoom = moved.roomId ? Number(moved.roomId) : undefined;
              if (origRoom && hasConflict(String(newDateStr), String(slot.start), String(slot.end), Number(moved.teacherId), gId, Number(origRoom))) {
                // try pick another
                const room = pickClassroom(String(moved.subject), Number(moved.groupSize) || 0, String(newDateStr), String(slot.start), String(slot.end));
                if (!room) continue;
                moved.roomId = Number(room.id);
              } else if (origRoom) {
                moved.roomId = Number(origRoom);
              } else {
                const room = pickClassroom(String(moved.subject), Number(moved.groupSize) || 0, String(newDateStr), String(slot.start), String(slot.end));
                if (room) moved.roomId = Number(room.id);
              }
              // Final assignment
              moved.date = newDateStr;
              moved.day = this.dayName(newDateObj);
              moved.startTime = slot.start;
              moved.endTime = slot.end;
              if (!byDow.has(targetDow)) byDow.set(targetDow, []);
              byDow.get(targetDow).push(moved);
              assigned = true;
              break;
            }
            if (!assigned) {
              // Revert donor pop if couldn't place
              donorLessons.push(moved);
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
          // Дополнительные проверки при уплотнении (lunch, noFirst/noLast, preferredDays, maxLessonsPerDay, holidays, wouldExceedConsecutive)
          const newDateStr = this.toLocalDateStr(dateObj);
          if (holidaySet.has(newDateStr) || !this.isWorkingDay(dateObj, params.constraints.excludeWeekends)) { slotIdx++; continue; }
          if (this.countGroupDayLessons(draft.filter(x=>x!==lesson), Number(lesson.groupId), newDateStr) >= maxLessonsPerDay) { slotIdx++; continue; }
          if (lunchBreak && this.intervalOverlap(String(targetSlot.start), String(targetSlot.end), String(lunchBreak.start), String(lunchBreak.end))) { slotIdx++; continue; }
          if (noFirst.has(String(lesson.subject).toLowerCase()) && targetSlot.start === firstSlotStart) { slotIdx++; continue; }
          if (noLast.has(String(lesson.subject).toLowerCase()) && targetSlot.start === lastSlotStart) { slotIdx++; continue; }
          const subjPref2 = preferredDaysMap[lesson.subject];
          const dowNorm2 = this.localWeekday(dateObj);
          if (subjPref2 && subjPref2.length && !subjPref2.includes(dowNorm2)) { slotIdx++; continue; }
          if (this.wouldExceedConsecutive(draft.filter(x=>x!==lesson), [Number(lesson.groupId)], dateObj, String(targetSlot.start), String(targetSlot.end), Number(params.constraints.maxConsecutiveHours), Number(breakDuration))) { slotIdx++; continue; }
          // Смена аудитории при необходимости: если помещение конфликтует — снимем и подберём новое ниже в финальном проходе
          if (lesson.roomId) {
            lesson.roomId = undefined;
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

    // --- Финальная пересборка occupancy и попытка подобрать аудитории для уроков без roomId ---
    try {
      // Rebuild occupancy from scratch
      occupancy.clear();
      const reserveLocal = (date: string, start: string, end: string, teacherId: number, groupId: number, roomId?: number) => reserve(date, start, end, teacherId, groupId, roomId);
      for (const l of draft) {
        const rid = l.roomId ? Number(l.roomId) : undefined;
  if (rid) reserveLocal(this.toLocalDateStr(new Date(String(l.date))), String(l.startTime), String(l.endTime), Number(l.teacherId), Number(l.groupId), Number(rid));
      }
      // Assign rooms for lessons without roomId
      for (const l of draft) {
        if (l.roomId) continue;
        const groupSize = l.groupSize || groupSizeMap.get(Number(l.groupId)) || 0;
        const room = pickClassroom(String(l.subject), Number(groupSize) || 0, String(l.date), String(l.startTime), String(l.endTime));
        if (!room) continue;
        // check again for conflict with room (loose overlap)
  if (!hasRoomConflictLoose(this.toLocalDateStr(new Date(String(l.date))), String(l.startTime), String(l.endTime), Number(room.id))) {
          l.roomId = Number(room.id);
          reserveLocal(this.toLocalDateStr(new Date(String(l.date))), String(l.startTime), String(l.endTime), Number(l.teacherId), Number(l.groupId), Number(room.id));
        }
      }
    } catch (e) {
      this.logger.warn('Final classroom assignment failed', e);
    }

    return { draft, stats: { draftCount: draft.length, classroomsAssigned: draft.filter(d=>d.roomId).length } };
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
  lessonDurationMinutes: Number((params as any)?.constraints?.lessonDuration ?? 45), // синхронизировано с heuristicDraft
  breakMinutes: (params as any)?.constraints?.minBreakDuration ?? 10,
  holidays: (params as any)?.constraints?.customHolidays || (params as any)?.customHolidays || [],
  lunchBreakTime: (params as any)?.constraints?.lunchBreakTime,
      weights: (params as any)?.constraints?.weights,
  forceBiweeklyStudyPlanIds: (params as any)?.forceBiweeklyStudyPlanIds || [],
    };
    const typedDraft: DraftItem[] = draft.map(d => ({ ...d }));
  return this.optimizer.optimize(typedDraft, mapped);
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
    const overlaps = (a:any,b:any) => !(a.endTime <= b.startTime || a.startTime >= b.endTime);
    const listOverlaps = (items: any[], keyFn:(x:any)=>string) => {
      const out:any[] = [];
      const buckets = new Map<string, any[]>();
      for (const it of items) {
        const k = `${keyFn(it)}|${it.date}`;
        if (!buckets.has(k)) buckets.set(k, []);
        buckets.get(k).push(it);
      }
      for (const [, arr] of buckets) {
        arr.sort((a,b)=>String(a.startTime).localeCompare(String(b.startTime)));
        for (let i=0;i<arr.length-1;i++) {
          const a = arr[i], b = arr[i+1];
          if (overlaps(a,b)) out.push({ a, b });
        }
      }
      return out;
    };

  const items: any[] = (generated.generatedSchedule || []);
    const T = listOverlaps(items, (x:any)=>`T:${x.teacherId}`);
    const G = listOverlaps(items, (x:any)=>`G:${x.groupId}`);
    const R = listOverlaps(items.filter((x:any)=>x.roomId), (x:any)=>`R:${x.roomId}`);

    const conflicts = [
      ...T.map(({a,b})=>({type:'TEACHER_OVERLAP', items:[a,b]})),
      ...G.map(({a,b})=>({type:'GROUP_OVERLAP', items:[a,b]})),
      ...R.map(({a,b})=>({type:'ROOM_OVERLAP', items:[a,b]})),
    ];
    return Promise.resolve({ conflicts, isOk: conflicts.length === 0 });
  }

  async apply(generated: any) {
    const created: any[] = [];
    const templates = Array.isArray(generated.recurringTemplates) ? generated.recurringTemplates : [];
    const singles = Array.isArray(generated.singleOccurrences) ? generated.singleOccurrences : [];

    if (templates.length || singles.length) {
      this.logger.log(`APPLY: persisting ${templates.length} templates and ${singles.length} singles`);
      
      // Prepare template data for bulk insert
      const templateData: any[] = [];
      for (const tpl of templates) {
        try {
          if (!tpl.groupId || !tpl.teacherId || !tpl.dayOfWeek) continue;
          const studyPlanId = tpl.studyPlanId ? Number(tpl.studyPlanId) : undefined;
          let studyPlan = studyPlanId ? await this.prisma.studyPlan.findUnique({ where: { id: studyPlanId } }) : null;
          if (!studyPlan) {
            studyPlan = await this.prisma.studyPlan.findFirst({ where: { name: tpl.subject } });
          }
          if (!studyPlan) continue;
          templateData.push({
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
          });
        } catch (e) {
          this.logger.warn('Skip template item', e);
        }
      }
      
      // Prepare single data for bulk insert
      const singleData: any[] = [];
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
          singleData.push({
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
          });
        } catch (e) {
          this.logger.warn('Skip single item', e);
        }
      }
      
      // Bulk insert templates
      if (templateData.length) {
        const templateResult = await this.prisma.schedule.createMany({
          data: templateData,
          skipDuplicates: true
        });
        this.logger.log(`Created ${templateResult.count} template schedules`);
      }
      
      // Bulk insert singles
      if (singleData.length) {
        const singleResult = await this.prisma.schedule.createMany({
          data: singleData,
          skipDuplicates: true
        });
        this.logger.log(`Created ${singleResult.count} single schedules`);
      }
      
      const totalCreated = (templateData.length ? await this.prisma.schedule.count({ where: { isAiGenerated: true, aiConfidence: generated.confidence || 0 } }) : 0) + (singleData.length ? await this.prisma.schedule.count({ where: { isAiGenerated: true, aiConfidence: generated.confidence || 0 } }) : 0);
      return { createdCount: totalCreated, created: [] };
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
      const dow = this.localWeekday(cur);
      const working = excludeWeekends ? (dow>=1 && dow<=5) : (dow>=1 && dow<=6); // исключаем воскресенье
      if (working) days++;
      cur.setDate(cur.getDate()+1);
    }
    const divisor = excludeWeekends ? 5 : 6; // считаем субботу учебным днём если не excludeWeekends
    return Math.max(1, Math.ceil(days / divisor));
  }
  private isWorkingDay(d: Date, excludeWeekends?: boolean) {
    const dow = d.getDay(); // 0=Sun..6=Sat
    return excludeWeekends ? (dow >= 1 && dow <= 5) : (dow >= 1 && dow <= 6);
  }
  private dayName(d: Date) { const wd = this.localWeekday(d); return ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'][wd-1]; }
  private dayNum(d: Date) { return this.localWeekday(d); }
  private hasTeacherConflict(draft: any[], teacherId: number, date: Date, startTime: string, endTime: string) {
  const dateStr = this.toLocalDateStr(date);
    return draft.some(i => i.teacherId === teacherId && i.date === dateStr && !(i.endTime <= startTime || i.startTime >= endTime));
  }
  private hasGroupConflict(draft: any[], groupId: number, date: Date, startTime: string, endTime: string) {
  const dateStr = this.toLocalDateStr(date);
    return draft.some(i => Number(i.groupId) === Number(groupId) && i.date === dateStr && !(i.endTime <= startTime || i.startTime >= endTime));
  }
  private wouldExceedConsecutive(draft: any[], groupIds: number[], date: Date, startTime: string, endTime: string, maxConsecutive: number, breakMinutes: number) {
    if (!maxConsecutive) return false;
  const dateStr = this.toLocalDateStr(date);
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
  private toLocalDateStr(d: Date) {
    return new Intl.DateTimeFormat('en-CA', { timeZone: this.TZ, year:'numeric', month:'2-digit', day:'2-digit'}).format(d);
  }
  private localWeekday(d: Date) { // 1..7, пн..вс
    const s = this.toLocalDateStr(d);
    const [y,m,dd] = s.split('-').map(Number);
    const loc = new Date(y, m-1, dd, 0,0,0);
    const wd = loc.getDay();
    return wd === 0 ? 7 : wd;
  }
}
