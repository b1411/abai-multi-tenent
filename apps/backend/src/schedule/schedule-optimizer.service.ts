//schedule-optimizer.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Classroom } from '../../generated/prisma';

type DraftItem = {
  tempId?: string;
  studyPlanId?: number;
  teacherId: number;
  teacherName?: string;
  groupId: number;
  groupName?: string;
  subject: string;
  date: string; // YYYY-MM-DD
  day?: string;
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  roomId?: string | number;
  roomType?: string;
  roomCapacity?: number;
  groupSize?: number;
  status?: string;
  type?: string;
  repeat?: string;
};

type DayIdx = {
  slots: { start: string; end: string; startMin: number; endMin: number }[];
  slotByStart: Map<string, number>;
  teacherBusy: Map<number, boolean[]>;
  groupBusy: Map<number, boolean[]>;
  roomBusy: Map<number, boolean[]>; // roomId -> slots[]
  groupCount: Map<number, number>;
  teacherCount: Map<number, number>;
};

type WorkingHours = { start: string; end: string };

export interface OptimizerParams {
  startDate: string; // ISO date
  endDate: string;   // ISO date
  workingHours: WorkingHours;
  maxConsecutiveHours?: number;
  maxLessonsPerDay?: number; // максимальное число уроков в день
  excludeWeekends?: boolean;
  minBreakMinutes?: number; // for transitions
  lessonDurationMinutes?: number; // длительность урока
  breakMinutes?: number; // стандартная перемена между уроками
  holidays?: string[]; // список дат (YYYY-MM-DD) когда нельзя ставить уроки
  lunchBreakTime?: { start: string; end: string }; // обеденный перерыв
  forbiddenFirstSubjects?: string[]; // предметы, которые нельзя ставить первым уроком
  forbiddenLastSubjects?: string[]; // предметы, которые нельзя ставить последним уроком
  weights?: {
    windows?: number;
    fairness?: number;
    preferences?: number;
    heavyLate?: number;
    transitions?: number;
    harmony?: number;
    timeConsistency?: number;
  };
  /** Включает подробное логирование процесса оптимизации */
  debug?: boolean;
  /** Явно указанные studyPlanId для преобразования еженедельного паттерна в A/B (biweekly). */
  forceBiweeklyStudyPlanIds?: number[];
}

@Injectable()
export class ScheduleOptimizerService {
  private readonly logger = new Logger(ScheduleOptimizerService.name);
  private _datesCache: string[] | null = null;

  constructor(private readonly prisma: PrismaService) {}

  private canPlace(it: DraftItem, d: DayIdx, params: OptimizerParams): boolean {
    const s = d.slotByStart.get(it.startTime);
    if (s == null) return false;

    // занятость
    if (d.teacherBusy.get(it.teacherId)?.[s] || d.groupBusy.get(it.groupId)?.[s]) return false;
    if (it.roomId && d.roomBusy.get(Number(it.roomId))?.[s]) return false;

    // лимиты на день (и для teacher, и для group)
    const maxPerDay = params.maxLessonsPerDay ?? Infinity;
    if ((d.groupCount.get(it.groupId) ?? 0) >= maxPerDay) return false;
    if ((d.teacherCount.get(it.teacherId) ?? 0) >= maxPerDay) return false;

    // обед
    if (params.lunchBreakTime && this.overlap(it.startTime, it.endTime, params.lunchBreakTime.start, params.lunchBreakTime.end)) return false;

    // maxConsecutive: посмотри соседние слоты только для этой группы
    if (params.maxConsecutiveHours) {
      let chain = 1;
      const leftBusy  = s>0               && d.groupBusy.get(it.groupId)?.[s-1];
      const rightBusy = s<d.slots.length-1&& d.groupBusy.get(it.groupId)?.[s+1];
      if (leftBusy)  chain++;
      if (rightBusy) chain++;
      if (chain > params.maxConsecutiveHours) return false;
    }
    return true;
  }

  private occupy(it: DraftItem, d: DayIdx, on: boolean) {
    const s = d.slotByStart.get(it.startTime);
    if (s == null) return; // мягко пропускаем офф-грид; можно ещё залогировать в debug
    if (!d.teacherBusy.has(it.teacherId)) d.teacherBusy.set(it.teacherId, Array(d.slots.length).fill(false));
    if (!d.groupBusy.has(it.groupId)) d.groupBusy.set(it.groupId, Array(d.slots.length).fill(false));
    d.teacherBusy.get(it.teacherId)[s] = on;
    d.groupBusy.get(it.groupId)[s] = on;
    if (it.roomId) {
      if (!d.roomBusy.has(Number(it.roomId))) d.roomBusy.set(Number(it.roomId), Array(d.slots.length).fill(false));
      d.roomBusy.get(Number(it.roomId))[s] = on;
    }
    d.groupCount.set(it.groupId, Math.max(0, (d.groupCount.get(it.groupId) ?? 0) + (on ? 1 : -1)));
    d.teacherCount.set(it.teacherId, Math.max(0, (d.teacherCount.get(it.teacherId) ?? 0) + (on ? 1 : -1)));
  }

  async optimize(
    draft: DraftItem[],
    params: OptimizerParams
  ): Promise<{
    generatedSchedule: DraftItem[];
    confidence: number;
    scoreBreakdown: Record<string, number>;
    hardViolations: string[];
    iterations: number;
  // Новые поля: агрегированное регулярное расписание
  recurringTemplates: AggregatedRecurringItem[];
  singleOccurrences: AggregatedRecurringItem[];
  }> {
    const startedAt = Date.now();
    const dbg = !!params.debug;
    const log = (msg: string, meta?: Record<string, unknown>) => {
      if (dbg) {
        if (meta) this.logger.debug(msg + ' ' + JSON.stringify(meta)); else this.logger.debug(msg);
      }
    };
    this.logger.log(`OPTIMIZER: start generation window ${params.startDate} -> ${params.endDate} draftItems=${draft.length}${dbg ? ' (debug on)' : ''}`);

    const weights = {
      // Усиленный штраф за окна по умолчанию (было 5)
      windows: params.weights?.windows ?? 30,
      fairness: params.weights?.fairness ?? 3,
      preferences: params.weights?.preferences ?? 2,
      heavyLate: params.weights?.heavyLate ?? 2,
      transitions: params.weights?.transitions ?? 4,
      harmony: params.weights?.harmony ?? 2,
      timeConsistency: params.weights?.timeConsistency ?? 1,
    };
    log('Weights resolved', weights);

    const start = new Date(params.startDate);
    const end = new Date(params.endDate);

    // Load real data for constraints
    const [classrooms, existingSchedules, teacherVacations] = await Promise.all([
      this.prisma.classroom.findMany({ where: { deletedAt: null } }),
      this.prisma.schedule.findMany({
        where: {
          date: { gte: start, lte: end },
          status: { not: 'CANCELLED' },
          deletedAt: null,
        },
        select: {
          id: true,
          date: true,
          startTime: true,
          endTime: true,
          teacherId: true,
          groupId: true,
          classroomId: true,
        },
      }),
      this.prisma.vacation.findMany({
        where: {
          status: 'approved',
          startDate: { lte: end },
          endDate: { gte: start },
        },
        select: { teacherId: true, startDate: true, endDate: true },
      }),
    ]);
    log('Loaded context', {
      classrooms: classrooms.length,
      existingSchedules: existingSchedules.length,
      teacherVacations: teacherVacations.length
    });

    const roomById = new Map<string, Classroom>(classrooms.map((c): [string, Classroom] => [String(c.id), c]));
    const timeSlotsByDate = this.buildDailySlotsMap(
      start,
      end,
      params.workingHours,
      params.lessonDurationMinutes ?? 45,
      params.breakMinutes ?? 10,
      params.excludeWeekends
    );
    log('Built daily slot map', { days: timeSlotsByDate.size });

    // Seed plan from draft (cloned)
    let plan: DraftItem[] = draft.map(d => ({ ...d }));
    // Hydrate missing group sizes by querying groups once
    try {
      const groupIds = Array.from(new Set(plan.map(p => p.groupId).filter(Boolean)));
      if (groupIds.length) {
        const groups = await this.prisma.group.findMany({ where: { id: { in: groupIds } }, include: { students: true } });
        const groupSizeMap = new Map<number, number>();
        groups.forEach(g => groupSizeMap.set(g.id, g.students?.length ?? 0));
        for (const p of plan) {
          if (!p.groupSize) p.groupSize = groupSizeMap.get(p.groupId) ?? p.groupSize ?? 0;
        }
      }
    } catch (e) {
      this.logger.debug('Failed to hydrate group sizes: ' + String(e));
    }
    log('Initial plan seeded');

    // Build dayIdx for fast O(1) checks
    const dayIdx = new Map<string, DayIdx>();
    for (const [date, slotStrings] of timeSlotsByDate) {
      const slots = slotStrings.map(s => {
        const [sh, sm] = s.start.split(':').map(Number);
        const [eh, em] = s.end.split(':').map(Number);
        return { ...s, startMin: sh * 60 + sm, endMin: eh * 60 + em };
      });
      const idx: DayIdx = {
        slots,
        slotByStart: new Map(slots.map((s, i) => [s.start, i])),
        teacherBusy: new Map(),
        groupBusy: new Map(),
        roomBusy: new Map(),
        groupCount: new Map(),
        teacherCount: new Map(),
      };
      dayIdx.set(date, idx);
    }
    // Occupy existing schedules
    for (const e of existingSchedules) {
      const d = e.date.toISOString().split('T')[0];
      const idx = dayIdx.get(d);
      if (idx) {
        const fakeIt: DraftItem = { teacherId: e.teacherId, groupId: e.groupId, roomId: e.classroomId, startTime: e.startTime, date: d, subject: '', endTime: e.endTime };
        this.occupy(fakeIt, idx, true);
      }
    }
    // Occupy current plan
    for (const it of plan) {
      const idx = dayIdx.get(it.date);
      if (idx) this.occupy(it, idx, true);
    }

    // Build indexed maps to avoid repeated filters in validations
    const existingByDate = new Map<string, { date: Date; startTime: string; endTime: string; teacherId: number; groupId: number; classroomId: number | null }[]>();
    for (const e of existingSchedules) {
      const d = this.toLocalDateStr(e.date);
      (existingByDate.get(d) ?? existingByDate.set(d,[]).get(d)).push(e);
    }
    const vacationsByTeacher = new Map<number, { teacherId: number; startDate: Date; endDate: Date }[]>();
    for (const v of teacherVacations) {
      const arr = vacationsByTeacher.get(v.teacherId) || [];
      arr.push(v);
      vacationsByTeacher.set(v.teacherId, arr);
    }

    // Hard constraints validation
    let hardViolations = this.listHardViolations(plan, existingByDate, vacationsByTeacher, roomById, params.minBreakMinutes ?? 10, params);
    if (hardViolations.length) {
      this.logger.warn(`Initial hard violations: ${hardViolations.length}`);
      log('Sample violations', { sample: hardViolations.slice(0, 10) });
    } else {
      log('No initial hard violations');
    }
    if (hardViolations.length) {
      // Try to quickly fix by moving conflicting items to first available free slot/room
      plan = this.quickFeasibleRepair(plan, timeSlotsByDate, roomById, existingByDate, vacationsByTeacher, params, dayIdx);
      hardViolations = this.listHardViolations(plan, existingByDate, vacationsByTeacher, roomById, params.minBreakMinutes ?? 10, params);
      log('After quick repair', { remainingViolations: hardViolations.length });
    }

    // Local search optimization
    const maxIterations = 300;
    const timeBudgetMs = 1000; // 1s
    const startTs = Date.now();
    let bestPlan = plan.map(p => ({ ...p })); // Keep best plan copy
    let bestScore = this.softScore(plan, weights, roomById, params);
    let iterations = 0;
    log('Begin local search', { maxIterations, timeBudgetMs, initialScore: bestScore });

    while (iterations < maxIterations && (Date.now() - startTs) < timeBudgetMs) {
      iterations++;
      // Random move: 0 - move time, 1 - change room, 2 - swap two items
      const moveType = Math.floor(Math.random() * 3);
      let moved = false;
      if (moveType === 0) {
        moved = this.tryMoveRandomToAnotherSlot(plan, timeSlotsByDate, dayIdx, params);
      } else if (moveType === 1) {
        moved = this.tryChangeRandomRoom(plan, classrooms, dayIdx, params);
      } else {
        moved = this.trySwapTwoItems(plan, dayIdx, params);
      }
      if (moved) {
        const score = this.softScore(plan, weights, roomById, params);
        if (score < bestScore) {
          bestScore = score;
          bestPlan = plan.map(p => ({ ...p })); // Update best plan
          log('Improved plan', { iterations, bestScore });
        }
      }
      if (dbg && iterations % 50 === 0) {
        log('Progress checkpoint', { iterations, elapsedMs: Date.now() - startTs, currentBest: bestScore });
      }
    }
    log('Local search finished', { iterations, elapsedMs: Date.now() - startTs, bestScore });

    // Дополнительная стадия уплотнения (минимизация окон) после основного поиска
    log('Start compaction phase');
    const compacted = this.compactPlan(
      bestPlan.map(p => ({ ...p })),
      timeSlotsByDate,
      classrooms,
      existingByDate,
      vacationsByTeacher,
      roomById,
      params.minBreakMinutes ?? 10,
      params,
      dayIdx
    );
    const compactViolations = this.listHardViolations(compacted, existingByDate, vacationsByTeacher, roomById, params.minBreakMinutes ?? 10, params);
    let finalPlan = bestPlan;
    if (!compactViolations.length) {
      finalPlan = compacted;
      log('Compaction applied (no new violations)');
    } else {
      log('Compaction discarded due to violations', { count: compactViolations.length });
    }
    // Принудительное преобразование отдельных studyPlan в шаблон A/B, если указано
    if (params.forceBiweeklyStudyPlanIds && params.forceBiweeklyStudyPlanIds.length) {
      const targetSet = new Set(params.forceBiweeklyStudyPlanIds);
      const startBase = new Date(params.startDate + 'T00:00:00');
      const msWeek = 7 * 24 * 3600 * 1000;
      const weekIndex = (dateStr: string) => Math.floor((new Date(dateStr + 'T00:00:00').getTime() - startBase.getTime()) / msWeek);
      const buckets = this.groupBy(finalPlan, p => [p.studyPlanId ?? 'NA', p.groupId, p.teacherId, p.subject, p.startTime, p.endTime].join('|'));
      const transformed: DraftItem[] = [];
      for (const [, items] of buckets) {
        if (!items.length) continue;
        const spId = items[0].studyPlanId;
        if (spId && targetSet.has(spId)) {
          // Оставляем только одну чётность недель (той, где первая встреча)
          items.sort((a,b)=>a.date.localeCompare(b.date));
          const keepParity = weekIndex(items[0].date) % 2;
          const filtered = items.filter(it => (weekIndex(it.date) % 2) === keepParity);
          transformed.push(...filtered);
        } else {
          transformed.push(...items);
        }
      }
      if (transformed.length !== finalPlan.length) {
        this.logger.log(`FORCE BIWEEKLY: pruned ${finalPlan.length - transformed.length} lessons (studyPlans=${params.forceBiweeklyStudyPlanIds.join(',')})`);
        finalPlan = transformed;
      }
    }

    // Дополнительный агрессивный проход минимизации окон (после основного уплотнения)
    const minimized = this.minimizeWindows(
      finalPlan.map(p => ({ ...p })),
      timeSlotsByDate,
      classrooms,
      existingSchedules,
      teacherVacations,
      roomById,
      params.minBreakMinutes ?? 10,
      params,
      dayIdx
    );
  const minViol = this.listHardViolations(minimized, existingByDate, vacationsByTeacher, roomById, params.minBreakMinutes ?? 10, params);
    if (!minViol.length) {
      log('Window minimization applied');
      finalPlan = minimized;
    } else {
      log('Window minimization discarded due to violations', { count: minViol.length });
    }

    const finalBreakdown = this.softScoreBreakdown(finalPlan, weights, roomById, params);
    const finalConfidence = this.scoreToConfidence(this.softScore(finalPlan, weights, roomById, params), finalBreakdown);
    log('Final scoring', { breakdown: finalBreakdown, confidence: finalConfidence });

    // Агрегация в регулярные шаблоны (weekly/biweekly) + одиночные занятия
    log('Start aggregation');
    const aggregated = this.aggregateRecurring(finalPlan, params);
    log('Aggregation result', { templates: aggregated.templates.length, singles: aggregated.singles.length });
    if (dbg && aggregated.templates.length) {
      log('Template sample', { sample: aggregated.templates.slice(0, 5) });
    }

    const totalElapsed = Date.now() - startedAt;
    this.logger.log(`OPTIMIZER: done in ${totalElapsed} ms iterations=${iterations} templates=${aggregated.templates.length} singles=${aggregated.singles.length} score=${bestScore}`);

    // жёсткое исправление любых пересечений с обедом
    if (params.lunchBreakTime) {
      finalPlan = this.forceFixLunchOverlaps(
        finalPlan,
        timeSlotsByDate,
        classrooms,
        existingByDate,
        vacationsByTeacher,
        roomById,
        params.minBreakMinutes ?? 10,
        params,
        dayIdx
      );
    }

    return {
      generatedSchedule: finalPlan,
      confidence: finalConfidence,
      scoreBreakdown: finalBreakdown,
      hardViolations: this.listHardViolations(finalPlan, existingSchedules, teacherVacations, roomById, params.minBreakMinutes ?? 10, params),
      iterations,
      recurringTemplates: aggregated.templates,
      singleOccurrences: aggregated.singles,
    };
  }

  // --- Feasibility and score ---

  private listHardViolations(
    plan: DraftItem[],
    existing: { date: Date; startTime: string; endTime: string; teacherId: number; groupId: number; classroomId: number | null }[] | Map<string, { date: Date; startTime: string; endTime: string; teacherId: number; groupId: number; classroomId: number | null }[]>,
    vacations: { teacherId: number; startDate: Date; endDate: Date }[] | Map<number, { teacherId: number; startDate: Date; endDate: Date }[]>,
    roomById: Map<string, Classroom>,
    minBreakMinutes: number,
    params?: OptimizerParams
  ): string[] {
    const errs: string[] = [];
    const key = (x: string | number | undefined, d: string, s: string) => `${x ?? 'NA'}|${d}|${s}`;
    const seenT = new Set<string>();
    const seenG = new Set<string>();
    const seenR = new Set<string>();
    const holidaySet = new Set((params?.holidays || []));
    const lunch = params?.lunchBreakTime;

  for (const it of plan) {
      const d = it.date;
      if (holidaySet.has(d)) {
        errs.push(`HOLIDAY_SCHEDULED:${d}`);
        continue;
      }
      if (lunch && this.overlap(it.startTime, it.endTime, lunch.start, lunch.end)) {
        errs.push(`LUNCH_BREAK_OVERLAP:${d}:${it.startTime}`);
      }
      // Overlaps within candidate plan
      const kT = key(it.teacherId, d, it.startTime);
      const kG = key(it.groupId, d, it.startTime);
      const kR = key(it.roomId ?? 'NA', d, it.startTime);

      if (seenT.has(kT)) errs.push(`TEACHER_OVERLAP:${it.teacherId}:${d}:${it.startTime}`);
      if (seenG.has(kG)) errs.push(`GROUP_OVERLAP:${it.groupId}:${d}:${it.startTime}`);
      if (it.roomId && seenR.has(kR)) errs.push(`ROOM_OVERLAP:${it.roomId}:${d}:${it.startTime}`);

      seenT.add(kT);
      seenG.add(kG);
      if (it.roomId) seenR.add(kR);

      // Overlaps with existing DB schedules
        // Normalize existing (array or map) to dayExisting
        const dayExisting = Array.isArray(existing) ? existing.filter(e => this.toLocalDateStr(e.date) === d) : (existing.get(d) || []);
        for (const e of dayExisting) {
        if (this.overlap(it.startTime, it.endTime, e.startTime, e.endTime)) {
          if (e.teacherId === it.teacherId) errs.push(`TEACHER_BUSY:${it.teacherId}:${d}:${it.startTime}`);
          if (e.groupId === it.groupId) errs.push(`GROUP_BUSY:${it.groupId}:${d}:${it.startTime}`);
          if (it.roomId && e.classroomId && Number(it.roomId) === e.classroomId) errs.push(`ROOM_BUSY:${it.roomId}:${d}:${it.startTime}`);
        }
      }

      // Capacity
      if (it.roomId) {
        const room = roomById.get(String(it.roomId));
        if (room && it.groupSize && room.capacity < it.groupSize) {
          errs.push(`ROOM_CAPACITY:${it.roomId}:${d}:${it.startTime}`);
        }
      }

      // Vacation (vacations may be array or map by teacher)
      const vacList = Array.isArray(vacations) ? vacations.filter(v => v.teacherId === it.teacherId) : (vacations.get(it.teacherId) || []);
      if (vacList.some(v => this.dateInRange(d, v.startDate, v.endDate))) {
        errs.push(`TEACHER_VACATION:${it.teacherId}:${d}`);
      }
    }

    // Interval overlaps (teacher, group, room) beyond identical start times
  const overlapByTeacherDate = this.groupBy(plan, p => `${p.teacherId}|${p.date}`);
  for (const [, arr] of overlapByTeacherDate) {
      arr.sort((a,b)=>a.startTime.localeCompare(b.startTime));
      for (let i=0;i<arr.length-1;i++) {
        const a = arr[i], b = arr[i+1];
        if (this.overlap(a.startTime,a.endTime,b.startTime,b.endTime)) {
          errs.push(`TEACHER_INTERVAL_OVERLAP:${a.teacherId}:${a.date}:${a.startTime}`);
        }
      }
    }
  const overlapByGroupDate = this.groupBy(plan, p => `${p.groupId}|${p.date}`);
  for (const [, arr] of overlapByGroupDate) {
      arr.sort((a,b)=>a.startTime.localeCompare(b.startTime));
      for (let i=0;i<arr.length-1;i++) {
        const a = arr[i], b = arr[i+1];
        if (this.overlap(a.startTime,a.endTime,b.startTime,b.endTime)) {
          errs.push(`GROUP_INTERVAL_OVERLAP:${a.groupId}:${a.date}:${a.startTime}`);
        }
      }
    }
  const overlapByRoomDate = this.groupBy(plan.filter(p=>p.roomId), p => `${p.roomId}|${p.date}`);
  for (const [, arr] of overlapByRoomDate) {
      arr.sort((a,b)=>a.startTime.localeCompare(b.startTime));
      for (let i=0;i<arr.length-1;i++) {
        const a = arr[i]; const b = arr[i+1];
        if (this.overlap(String(a.startTime), String(a.endTime), String(b.startTime), String(b.endTime))) {
          errs.push(`ROOM_INTERVAL_OVERLAP:${a.roomId}:${a.date}:${a.startTime}`);
        }
      }
    }

    // Transition buffer: teacher and group successive lessons different buildings without buffer
    const byTeacherDate = this.groupBy(plan, p => `${p.teacherId}|${p.date}`);
    for (const [, arr] of byTeacherDate) {
      arr.sort((a, b) => a.startTime.localeCompare(b.startTime));
      for (let i = 0; i < arr.length - 1; i++) {
        const a = arr[i], b = arr[i + 1];
        if (this.minutesBetween(a.endTime, b.startTime) < minBreakMinutes) {
          const aB = this.roomBuilding(roomById, a.roomId);
          const bB = this.roomBuilding(roomById, b.roomId);
          if (aB && bB && aB !== bB) errs.push(`TRANSITION_BUFFER_TEACHER:${a.teacherId}:${a.date}:${a.startTime}`);
        }
      }
    }
    const byGroupDate = this.groupBy(plan, p => `${p.groupId}|${p.date}`);
    for (const [, arr] of byGroupDate) {
      arr.sort((a, b) => a.startTime.localeCompare(b.startTime));
      for (let i = 0; i < arr.length - 1; i++) {
        const a = arr[i], b = arr[i + 1];
        if (this.minutesBetween(a.endTime, b.startTime) < minBreakMinutes) {
          const aB = this.roomBuilding(roomById, a.roomId);
          const bB = this.roomBuilding(roomById, b.roomId);
          if (aB && bB && aB !== bB) errs.push(`TRANSITION_BUFFER_GROUP:${a.groupId}:${a.date}:${a.startTime}`);
        }
      }
    }

    // Forbidden first/last subjects
    if (params?.forbiddenFirstSubjects?.length || params?.forbiddenLastSubjects?.length) {
      const byGroupDate = this.groupBy(plan, p => `${p.groupId}|${p.date}`);
      for (const [, lessons] of byGroupDate) {
        if (lessons.length === 0) continue;
        lessons.sort((a, b) => a.startTime.localeCompare(b.startTime));
        const first = lessons[0];
        const last = lessons[lessons.length - 1];
        if (params.forbiddenFirstSubjects?.includes(first.subject)) {
          errs.push(`FORBIDDEN_FIRST_SUBJECT:${first.groupId}:${first.date}:${first.subject}`);
        }
        if (params.forbiddenLastSubjects?.includes(last.subject)) {
          errs.push(`FORBIDDEN_LAST_SUBJECT:${last.groupId}:${last.date}:${last.subject}`);
        }
      }
    }

    // Hard: max lessons per day per group / teacher & max consecutive chain (gap <= minBreakMinutes)
  const MAX_PER_DAY = params?.maxLessonsPerDay;
    if (MAX_PER_DAY) {
      const byGroup = this.groupBy(plan, p => `${p.groupId}|${p.date}`);
      for (const [k, arr] of byGroup) {
        if (arr.length > MAX_PER_DAY) errs.push(`GROUP_MAX_PER_DAY:${k}:${arr.length}`);
      }
      const byTeacher = this.groupBy(plan, p => `${p.teacherId}|${p.date}`);
      for (const [k, arr] of byTeacher) {
        if (arr.length > MAX_PER_DAY) errs.push(`TEACHER_MAX_PER_DAY:${k}:${arr.length}`);
      }
    }
    // consecutive
    const byGroupCons = this.groupBy(plan, p => `${p.groupId}|${p.date}`);
    for (const [, arr] of byGroupCons) {
      arr.sort((a,b)=>a.startTime.localeCompare(b.startTime));
      let chain = 1;
      for (let i=1;i<arr.length;i++) {
        const prev = arr[i-1]; const cur = arr[i];
        const gap = this.minutesBetween(prev.endTime, cur.startTime);
        if (gap <= minBreakMinutes) chain++; else chain=1;
  const maxCons = params?.maxConsecutiveHours;
        if (maxCons && chain > maxCons) { errs.push(`GROUP_MAX_CONSECUTIVE:${arr[i].groupId}:${arr[i].date}:${prev.startTime}`); break; }
      }
    }
    const byTeacherCons = this.groupBy(plan, p => `${p.teacherId}|${p.date}`);
    for (const [, arr] of byTeacherCons) {
      arr.sort((a,b)=>a.startTime.localeCompare(b.startTime));
      let chain = 1;
      for (let i=1;i<arr.length;i++) {
        const prev = arr[i-1]; const cur = arr[i];
        const gap = this.minutesBetween(prev.endTime, cur.startTime);
        if (gap <= minBreakMinutes) chain++; else chain=1;
  const maxCons = params?.maxConsecutiveHours;
        if (maxCons && chain > maxCons) { errs.push(`TEACHER_MAX_CONSECUTIVE:${arr[i].teacherId}:${arr[i].date}:${prev.startTime}`); break; }
      }
    }

    return errs;
  }

  private softScore(plan: DraftItem[], w: Record<string, number>, roomById: Map<string, Classroom>, params: OptimizerParams): number {
    const b = this.softScoreBreakdown(plan, w, roomById, params);
    // Sum weighted penalties
    return b.windows + b.fairness + b.preferences + b.heavyLate + b.transitions + b.harmony + b.timeConsistency;
  }

  private softScoreBreakdown(plan: DraftItem[], w: Record<string, number>, roomById: Map<string, Classroom>, params: OptimizerParams) {
    const windowsPenalty = this.countWindows(plan) * w.windows;
    const fairnessPenalty = this.fairnessPenalty(plan) * w.fairness;
    const prefPenalty = this.preferencesPenalty() * w.preferences; // placeholder, 0 without explicit prefs
    const heavyLatePenalty = this.heavyLatePenalty(plan) * w.heavyLate;
    const transitionPenalty = this.transitionPenalty(plan, roomById, params.minBreakMinutes ?? 10) * w.transitions;
    const harmonyPenalty = this.harmonyPenalty(plan, roomById) * w.harmony;
    const timeConsistencyPenalty = this.timeConsistencyPenalty(plan) * w.timeConsistency;
    const forbiddenSubjectsPenalty = this.forbiddenSubjectsPenalty(plan, params) * w.preferences; // use preferences weight for forbidden subjects

    return {
      windows: windowsPenalty,
      fairness: fairnessPenalty,
      preferences: prefPenalty + forbiddenSubjectsPenalty,
      heavyLate: heavyLatePenalty,
      transitions: transitionPenalty,
      harmony: harmonyPenalty,
      timeConsistency: timeConsistencyPenalty,
    };
  }

  // --- Repair and moves ---

  private quickFeasibleRepair(
    plan: DraftItem[],
    slotsByDate: Map<string, { start: string; end: string }[]>,
    roomById: Map<string, Classroom>,
    existing: { date: Date; startTime: string; endTime: string; teacherId: number; groupId: number; classroomId: number | null }[] | Map<string, { date: Date; startTime: string; endTime: string; teacherId: number; groupId: number; classroomId: number | null }[]>,
    vacations: { teacherId: number; startDate: Date; endDate: Date }[] | Map<number, { teacherId: number; startDate: Date; endDate: Date }[]>,
    params: OptimizerParams,
    dayIdx: Map<string, DayIdx>
  ): DraftItem[] {
    const repaired: DraftItem[] = [];
    for (const it of plan) {
      const d = dayIdx.get(it.date);
      if (!d) {
        repaired.push(it); // keep as is
        continue;
      }
      // Free current
      this.occupy(it, d, false);

      const rooms = Array.from(roomById.values()).filter(r => (it.groupSize ? r.capacity >= it.groupSize : true));
      let placed: DraftItem | null = null;

      // try same slot with alternative room
      for (const r of rooms) {
        const candidate = { ...it, roomId: String(r.id) };
        if (this.canPlace(candidate, d, params)) {
          placed = { ...candidate, roomType: r.type, roomCapacity: r.capacity };
          this.occupy(placed, d, true);
          break;
        }
      }

      if (!placed) {
        // try different slot on same day
        const candidates = slotsByDate.get(it.date) || [];
        for (const s of candidates) {
          if (s.start === it.startTime) continue; // already tried
          const alt: DraftItem = { ...it, startTime: s.start, endTime: s.end };
          for (const r of rooms) {
            const candidate = { ...alt, roomId: String(r.id) };
            if (this.canPlace(candidate, d, params)) {
              placed = { ...candidate, roomType: r.type, roomCapacity: r.capacity };
              this.occupy(placed, d, true);
              break;
            }
          }
          if (placed) break;
        }
      }

      if (placed) {
        repaired.push(placed);
      } else {
        // revert and keep original
        this.occupy(it, d, true);
        repaired.push(it);
      }
    }
    return repaired;
  }

  private pickFeasibleRoom(
    it: DraftItem,
    rooms: Classroom[],
    partialPlan: DraftItem[],
    existing: { date: Date; startTime: string; endTime: string; teacherId: number; groupId: number; classroomId: number | null }[] | Map<string, { date: Date; startTime: string; endTime: string; teacherId: number; groupId: number; classroomId: number | null }[]>,
    vacations: { teacherId: number; startDate: Date; endDate: Date }[] | Map<number, { teacherId: number; startDate: Date; endDate: Date }[]>,
    roomById: Map<string, Classroom>,
  minBreakMinutes: number,
  params?: OptimizerParams
  ): Classroom | null {
    const suitable = rooms
      .filter(r => (it.groupSize ? r.capacity >= it.groupSize : true))
      .filter(r => !this.roomBusy(String(r.id), it.date, it.startTime, it.endTime, partialPlan, existing))
      .sort((a, b) => {
        // Prefer close capacity and matching type
        const aScore = this.roomScore(it.subject, it.groupSize || 0, a);
        const bScore = this.roomScore(it.subject, it.groupSize || 0, b);
        return bScore - aScore;
      });

    for (const r of suitable) {
      const candidate = { ...it, roomId: String(r.id) };
  const v = this.listHardViolations([candidate, ...partialPlan], existing, vacations, roomById, minBreakMinutes, params);
      if (!v.length) return r;
    }
    return null;
  }

  private moveRandomToAnotherSlot(plan: DraftItem[], slotsByDate: Map<string, { start: string; end: string }[]>) {
    if (!plan.length) return;
    const i = Math.floor(Math.random() * plan.length);
    const it = plan[i];
    const slots = slotsByDate.get(it.date) || [];
    if (!slots.length) return;
    const s = slots[Math.floor(Math.random() * slots.length)];
    plan[i] = { ...it, startTime: s.start, endTime: s.end };
  }

  private changeRandomRoom(plan: DraftItem[], rooms: Classroom[]) {
    if (!plan.length || !rooms.length) return;
    const i = Math.floor(Math.random() * plan.length);
    const cand = rooms[Math.floor(Math.random() * rooms.length)];
    plan[i] = { ...plan[i], roomId: String(cand.id), roomType: cand.type, roomCapacity: cand.capacity };
  }

  private swapTwoItems(plan: DraftItem[]) {
    if (plan.length < 2) return;
    const i = Math.floor(Math.random() * plan.length);
    let j = Math.floor(Math.random() * plan.length);
    if (i === j) j = (j + 1) % plan.length;
    const a = plan[i], b = plan[j];
    plan[i] = { ...a, date: b.date, startTime: b.startTime, endTime: b.endTime, roomId: b.roomId };
    plan[j] = { ...b, date: a.date, startTime: a.startTime, endTime: a.endTime, roomId: a.roomId };
  }

  // --- Compaction (remove windows by pulling lessons earlier) ---
  private compactPlan(
    plan: DraftItem[],
    slotsByDate: Map<string, { start: string; end: string }[]>,
    classrooms: Classroom[],
    existing: { date: Date; startTime: string; endTime: string; teacherId: number; groupId: number; classroomId: number | null }[] | Map<string, { date: Date; startTime: string; endTime: string; teacherId: number; groupId: number; classroomId: number | null }[]>,
    vacations: { teacherId: number; startDate: Date; endDate: Date }[] | Map<number, { teacherId: number; startDate: Date; endDate: Date }[]>,
    roomById: Map<string, Classroom>,
    minBreakMinutes: number,
    params: OptimizerParams | undefined,
    dayIdx: Map<string, DayIdx>
  ): DraftItem[] {
    const byDate = this.groupBy(plan, p => p.date);
    for (const [date, dayItems] of byDate) {
      const slots = (slotsByDate.get(date) || []).slice().sort((a,b)=>a.start.localeCompare(b.start));
      const d = dayIdx.get(date);
      if (!d) continue;
      // Группируем по группе, чтобы уплотнять каждую отдельно
      const byGroup = this.groupBy(dayItems, p => String(p.groupId));
      for (const [, lessons] of byGroup) {
        if (lessons.length < 2) continue;
        lessons.sort((a,b)=>a.startTime.localeCompare(b.startTime));
        let slotIdx = 0;
        for (const lesson of lessons) {
          // Ищем самый ранний слот не нарушающий жестких ограничений
            for (let s = slotIdx; s < slots.length; s++) {
              const slot = slots[s];
              // Если урок уже стоит раньше или в этом слоте, пропускаем
              if (slot.start >= lesson.startTime) break; // дальше слоты только позже
              // Free current slot
              this.occupy(lesson, d, false);
              const candidate: DraftItem = { ...lesson, startTime: slot.start, endTime: slot.end };
              // Проверим конфликт по аудитории: если текущая занята в это новое время - попробуем подобрать другую
              let roomChanged = false;
              const sIdx = d.slotByStart.get(slot.start);
              if (candidate.roomId && sIdx != null && d.roomBusy.get(Number(candidate.roomId))?.[sIdx]) {
                // try find another room
                for (const r of classrooms.filter(c => (lesson.groupSize ? c.capacity >= lesson.groupSize : true))) {
                  const candRoom = { ...candidate, roomId: String(r.id) };
                  if (this.canPlace(candRoom, d, params)) {
                    candidate.roomId = String(r.id); candidate.roomType = r.type; candidate.roomCapacity = r.capacity;
                    roomChanged = true;
                    break;
                  }
                }
                if (!roomChanged) {
                  // Revert and continue
                  this.occupy(lesson, d, true);
                  continue;
                }
              }
              if (this.canPlace(candidate, d, params)) {
                // Применяем сдвиг
                lesson.startTime = candidate.startTime;
                lesson.endTime = candidate.endTime;
                if (roomChanged) {
                  lesson.roomId = candidate.roomId;
                  lesson.roomType = candidate.roomType;
                  lesson.roomCapacity = candidate.roomCapacity as any;
                }
                this.occupy(lesson, d, true);
                slotIdx = s + 1; // следующий урок начнем рассматривать с последующих слотов
              } else {
                // Revert
                this.occupy(lesson, d, true);
              }
            }
        }
      }
    }
    return plan;
  }

  // --- Extra window minimization (swap & pull to eliminate single-slot gaps) ---
  private minimizeWindows(
    plan: DraftItem[],
    slotsByDate: Map<string, { start: string; end: string }[]>,
    classrooms: Classroom[],
    existing: { date: Date; startTime: string; endTime: string; teacherId: number; groupId: number; classroomId: number | null }[] | Map<string, { date: Date; startTime: string; endTime: string; teacherId: number; groupId: number; classroomId: number | null }[]>,
    vacations: { teacherId: number; startDate: Date; endDate: Date }[] | Map<number, { teacherId: number; startDate: Date; endDate: Date }[]>,
    roomById: Map<string, Classroom>,
    minBreakMinutes: number,
    params: OptimizerParams | undefined,
    dayIdx: Map<string, DayIdx>
  ): DraftItem[] {
    // Стратегия: для каждой группы и дня пытаемся убрать одиночные окна между уроками
    const byGroupDate = this.groupBy(plan, p => `${p.groupId}|${p.date}`);
    for (const [, lessons] of byGroupDate) {
      if (lessons.length < 3) continue; // минимум 3 чтобы могло быть окно
      lessons.sort((a,b)=>a.startTime.localeCompare(b.startTime));
      const d = dayIdx.get(lessons[0].date);
      if (!d) continue;
      // Проход: ищем pattern [L1][WINDOW][L2]
      for (let i=0; i<lessons.length-2; i++) {
        const first = lessons[i];
        const middle = lessons[i+1];
        const last = lessons[i+2];
        const gap1 = this.minutesBetween(first.endTime, middle.startTime);
        const gap2 = this.minutesBetween(middle.endTime, last.startTime);
        // окно считается если gap1 >= 10 и middle - единственный урок отделённый одиночным пустым слотом
        if (gap1 >= 10 && gap1 <= 60) {
          // Попробуем перенести middle раньше (в слот first.startTime - duration уже нельзя) -> попробуем сдвиг middle к first.endTime
          const daySlots = (slotsByDate.get(first.date) || []).slice().sort((a,b)=>a.start.localeCompare(b.start));
          // Найдём самый ранний слот между first и last который пустой
          for (const s of daySlots) {
            if (s.start <= first.startTime) continue;
            if (s.start >= last.startTime) break;
            // занято ли это окно уже другим уроком группы
            if (lessons.some(l => l !== middle && this.overlap(l.startTime, l.endTime, s.start, s.end))) continue;
            // Free middle
            this.occupy(middle, d, false);
            // Кандидат переноса middle
            const candidate: DraftItem = { ...middle, startTime: s.start, endTime: s.end };
            // Проверим аудиторию
            let roomChanged = false;
            const sIdx = d.slotByStart.get(s.start);
            if (candidate.roomId && sIdx != null && d.roomBusy.get(Number(candidate.roomId))?.[sIdx]) {
              // try find another room
              for (const r of classrooms.filter(c => (middle.groupSize ? c.capacity >= middle.groupSize : true))) {
                const candRoom = { ...candidate, roomId: String(r.id) };
                if (this.canPlace(candRoom, d, params)) {
                  candidate.roomId = String(r.id); candidate.roomType = r.type; candidate.roomCapacity = r.capacity;
                  roomChanged = true;
                  break;
                }
              }
              if (!roomChanged) {
                this.occupy(middle, d, true); // revert
                continue;
              }
            }
            if (this.canPlace(candidate, d, params)) {
              middle.startTime = candidate.startTime;
              middle.endTime = candidate.endTime;
              if (roomChanged) {
                middle.roomId = candidate.roomId;
                middle.roomType = candidate.roomType;
                middle.roomCapacity = candidate.roomCapacity;
              }
              this.occupy(middle, d, true);
              break; // окно устранено
            } else {
              this.occupy(middle, d, true); // revert
            }
          }
        }
        // Попробуем swap middle с first или last если это уберёт окно
        const trySwap = (a: DraftItem, b: DraftItem) => {
          // Free both
          this.occupy(a, d, false);
          this.occupy(b, d, false);
          // Swap
          const origA = { ...a };
          const origB = { ...b };
          a.startTime = origB.startTime; a.endTime = origB.endTime; a.roomId = origB.roomId; a.roomType = origB.roomType; a.roomCapacity = origB.roomCapacity;
          b.startTime = origA.startTime; b.endTime = origA.endTime; b.roomId = origA.roomId; b.roomType = origA.roomType; b.roomCapacity = origA.roomCapacity;
          if (this.canPlace(a, d, params) && this.canPlace(b, d, params)) {
            this.occupy(a, d, true);
            this.occupy(b, d, true);
            return true;
          } else {
            // Revert
            a.startTime = origA.startTime; a.endTime = origA.endTime; a.roomId = origA.roomId; a.roomType = origA.roomType; a.roomCapacity = origA.roomCapacity;
            b.startTime = origB.startTime; b.endTime = origB.endTime; b.roomId = origB.roomId; b.roomType = origB.roomType; b.roomCapacity = origB.roomCapacity;
            this.occupy(a, d, true);
            this.occupy(b, d, true);
            return false;
          }
        };
        // Если большая дыра после middle — попробуем swap middle и last
        if (gap2 >= 10 && gap2 <= 60) {
          trySwap(middle, last);
        }
      }
    }
    return plan;
  }

  // --- Soft penalties implementations ---

  private countWindows(plan: DraftItem[]): number {
    let penalty = 0;
    // windows per group and teacher per day
    const byG = this.groupBy(plan, p => `${p.groupId}|${p.date}`);
    const byT = this.groupBy(plan, p => `${p.teacherId}|${p.date}`);

    for (const map of [byG, byT]) {
      for (const [, arr] of map) {
        arr.sort((a, b) => a.startTime.localeCompare(b.startTime));
        for (let i = 0; i < arr.length - 1; i++) {
          const gap = this.minutesBetween(arr[i].endTime, arr[i + 1].startTime);
          if (gap >= 10 && gap <= 60) penalty += 1; // window
          if (gap > 60) penalty += 2; // big window
        }
      }
    }
    return penalty;
  }

  private fairnessPenalty(plan: DraftItem[]): number {
    // workload distribution per day per teacher
    const byTeacher = this.groupBy(plan, p => String(p.teacherId));
    let penalty = 0;
    for (const [, arr] of byTeacher) {
      const byDay = new Map<string, number>();
      for (const it of arr) {
        byDay.set(it.date, (byDay.get(it.date) ?? 0) + 1);
      }
      const counts = Array.from(byDay.values());
      if (counts.length <= 1) continue;
      const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
  const variance = counts.reduce((s, c) => s + (c - avg) * (c - avg), 0) / counts.length;
  penalty += variance / (avg + 0.01); // нормализуем
    }
    return penalty;
  }

  private preferencesPenalty(): number {
    // TODO: teacher/group/classroom preferences when data is available.
    return 0;
  }

  private heavyLatePenalty(plan: DraftItem[]): number {
    // Penalize heavy subjects late (after 16:00)
    let penalty = 0;
    for (const it of plan) {
      const heavy = /МАТ|ФИЗ|ХИМ|ЯЗЫК|MATH|PHYS|CHEM|LANG/i.test(it.subject);
      if (heavy && this.timeToMin(it.startTime) >= this.timeToMin('16:00')) penalty += 1;
    }
    return penalty;
  }

  private transitionPenalty(plan: DraftItem[], roomById: Map<string, Classroom>, minBreak: number): number {
    let penalty = 0;
    const byTeacherDate = this.groupBy(plan, p => `${p.teacherId}|${p.date}`);
    for (const [, arr] of byTeacherDate) {
      arr.sort((a, b) => a.startTime.localeCompare(b.startTime));
      for (let i = 0; i < arr.length - 1; i++) {
        const a = arr[i], b = arr[i + 1];
        const aB = this.roomBuilding(roomById, a.roomId);
        const bB = this.roomBuilding(roomById, b.roomId);
        if (aB && bB && aB !== bB) {
          const gap = this.minutesBetween(a.endTime, b.startTime);
          if (gap < minBreak) penalty += 2; else penalty += 1;
        }
      }
    }
    return penalty;
  }

  private harmonyPenalty(plan: DraftItem[], roomById: Map<string, Classroom>): number {
    // discourage many building changes for group
    let penalty = 0;
    const byGroupDate = this.groupBy(plan, p => `${p.groupId}|${p.date}`);
    for (const [, arr] of byGroupDate) {
      arr.sort((a, b) => a.startTime.localeCompare(b.startTime));
      for (let i = 0; i < arr.length - 1; i++) {
        const a = arr[i], b = arr[i + 1];
        const aB = this.roomBuilding(roomById, a.roomId);
        const bB = this.roomBuilding(roomById, b.roomId);
        if (aB && bB && aB !== bB) penalty += 1;
      }
    }
    return penalty;
  }

  private timeConsistencyPenalty(plan: DraftItem[]): number {
    // Penalize variance in start times for same subject/group/dayOfWeek
    let penalty = 0;
    const byKey = this.groupBy(plan, p => `${p.groupId}|${p.subject}|${(new Date(p.date)).getDay() || 7}`);
    for (const [, arr] of byKey) {
      const starts = arr.map(x => this.timeToMin(x.startTime));
      if (starts.length <= 1) continue;
      const avg = starts.reduce((a, b) => a + b, 0) / starts.length;
      const variance = starts.reduce((s, c) => s + (c - avg) * (c - avg), 0) / starts.length;
      penalty += variance / 60; // normalize to minutes
    }
    return penalty;
  }

  private forbiddenSubjectsPenalty(plan: DraftItem[], params: OptimizerParams): number {
    // Penalize forbidden first/last subjects
    let penalty = 0;
    const byGroupDate = this.groupBy(plan, p => `${p.groupId}|${p.date}`);
    for (const [, lessons] of byGroupDate) {
      if (lessons.length === 0) continue;
      lessons.sort((a, b) => a.startTime.localeCompare(b.startTime));
      const first = lessons[0];
      const last = lessons[lessons.length - 1];
      if (params.forbiddenFirstSubjects?.includes(first.subject)) {
        penalty += 5; // high penalty for forbidden first subject
      }
      if (params.forbiddenLastSubjects?.includes(last.subject)) {
        penalty += 5; // high penalty for forbidden last subject
      }
    }
    return penalty;
  }

  // --- Utilities ---

  private buildDailySlotsMap(start: Date, end: Date, wh: WorkingHours, lessonDuration: number, breakMinutes: number, excludeWeekends?: boolean) {
    const map = new Map<string, { start: string; end: string }[]>();
    const day = new Date(start);
    while (day <= end) {
      if (!excludeWeekends || (day.getDay() >= 1 && day.getDay() <= 5)) {
        const dateStr = day.toISOString().split('T')[0];
        map.set(dateStr, this.buildTimeSlots(wh.start, wh.end, lessonDuration, breakMinutes));
      }
      day.setDate(day.getDate() + 1);
    }
    return map;
  }
  private buildTimeSlots(start: string, end: string, lessonDuration: number, breakMinutes: number) {
    const slots: { start: string; end: string }[] = [];
    const toMinutes = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    const fromMinutes = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
    let cur = toMinutes(start);
    const endMin = toMinutes(end);
    while (cur + lessonDuration <= endMin) {
      const lessonStart = cur;
      const lessonEnd = cur + lessonDuration;
      slots.push({ start: fromMinutes(lessonStart), end: fromMinutes(lessonEnd) });
      cur = lessonEnd + breakMinutes; // перемена
    }
    return slots;
  }

  private overlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
    return !(aEnd <= bStart || aStart >= bEnd);
  }

  private timeToMin(t: string): number {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  }

  private minutesBetween(aEnd: string, bStart: string): number {
    return this.timeToMin(bStart) - this.timeToMin(aEnd);
  }

  private roomBuilding(roomById: Map<string, Classroom>, roomId?: string | number) {
    if (!roomId) return null;
    const r = roomById.get(String(roomId));
    return r?.building ?? null;
  }

  private dateInRange(dateStr: string, start: Date, end: Date) {
    const d = new Date(dateStr + 'T00:00:00Z');
    return d.getTime() >= new Date(start.toDateString()).getTime() && d.getTime() <= new Date(end.toDateString()).getTime();
  }

  private groupBy<T>(arr: T[], keyFn: (t: T) => string) {
    const map = new Map<string, T[]>();
    for (const it of arr) {
      const k = keyFn(it);
      let bucket = map.get(k);
      if (!bucket) { bucket = []; map.set(k, bucket); }
      bucket.push(it);
    }
    return map;
  }

  private roomBusy(roomId: string, date: string, start: string, end: string, partial: DraftItem[], existing: { date: Date; startTime: string; endTime: string; teacherId: number; groupId: number; classroomId: number | null }[] | Map<string, { date: Date; startTime: string; endTime: string; teacherId: number; groupId: number; classroomId: number | null }[]>): boolean {
    for (const p of partial) {
      if (String(p.roomId ?? '') === roomId && p.date === date && this.overlap(p.startTime, p.endTime, start, end)) return true;
    }
    if (Array.isArray(existing)) {
      for (const e of existing) {
        if (!e.classroomId) continue;
        if (String(e.classroomId) === roomId && this.toLocalDateStr(e.date) === date && this.overlap(e.startTime, e.endTime, start, end)) return true;
      }
    } else {
      const day = existing.get(date) || [];
      for (const e of day) {
        if (!e.classroomId) continue;
        if (String(e.classroomId) === roomId && this.overlap(e.startTime, e.endTime, start, end)) return true;
      }
    }
    return false;
  }

  private roomScore(subject: string, groupSize: number, room: Classroom): number {
    const subj = subject.toUpperCase();
    const preferred: string[] = [];
    if (/ИНФОРМ|ПРОГРАМ|COMPUT|IT/.test(subj)) preferred.push('COMPUTER_LAB', 'COMPUTER');
    if (/ФИЗИК|ХИМИ|LAB|ЛАБ/.test(subj)) preferred.push('LABORATORY', 'CHEMISTRY_LAB', 'PHYSICS_LAB');
    if (/ЛЕКЦ|THEOR|ТЕОР/.test(subj)) preferred.push('LECTURE_HALL', 'LECTURE');
    if (/СЕМИН|ДИСК/.test(subj)) preferred.push('SEMINAR_ROOM', 'PRACTICE');
    if (/СПОРТ|ФИЗКУЛ|PE|GYM/.test(subj)) preferred.push('GYMNASIUM', 'SPORT');
    if (/ПРАКТИК|WORK|МАСТЕР/.test(subj)) preferred.push('WORKSHOP');
    if (preferred.length === 0) preferred.push('AUDITORIUM', 'OTHER');

    const typeScore = preferred.includes(room.type) ? 2 : (room.type === 'AUDITORIUM' ? 1 : 0);
    const sizeRatio = groupSize ? room.capacity / groupSize : 2;
    const sizeScore = sizeRatio >= 1 && sizeRatio <= 1.5 ? 2 : sizeRatio <= 2 ? 1 : 0.3;
    return typeScore * 3 + sizeScore * 2;
  }

  private scoreToConfidence(totalScore: number, breakdown: Record<string, number>): number {
    // Heuristic: lower penalties -> higher confidence
    const sum = Object.values(breakdown).reduce((a, b) => a + b, 0);
    const base = Math.max(0, 1 - sum / (sum + 20)); // asymptotic
    return Math.max(0, Math.min(1, (base + (totalScore === 0 ? 0.1 : 0)))); // small bonus if perfect
  }

  // --- Aggregation to recurring patterns ---
  private aggregateRecurring(plan: DraftItem[], params: OptimizerParams): { templates: AggregatedRecurringItem[]; singles: AggregatedRecurringItem[] } {
    interface Bucket { items: DraftItem[]; }
    const buckets = new Map<string, Bucket>();
    const keyFn = (it: DraftItem) => [it.groupId, it.teacherId, it.studyPlanId ?? 'NA', it.subject, it.startTime, it.endTime].join('|');
    for (const it of plan) {
      const k = keyFn(it);
      let b = buckets.get(k);
      if (!b) { b = { items: [] }; buckets.set(k, b); }
      b.items.push(it);
    }

    const templates: AggregatedRecurringItem[] = [];
    const singles: AggregatedRecurringItem[] = [];
    const toDate = (s: string) => new Date(s + 'T00:00:00Z');
    const dateStr = (d: Date) => d.toISOString().split('T')[0];
    const dayOfWeek = (d: Date) => { const wd = d.getUTCDay(); return wd === 0 ? 7 : wd; };
    const diffDays = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / 86400000);

    for (const [, bucket] of buckets) {
      const dates = bucket.items.map(i => toDate(i.date)).sort((a,b)=>a.getTime()-b.getTime());
      const uniqueDates: Date[] = [];
      for (const d of dates) { if (!uniqueDates.length || dateStr(uniqueDates[uniqueDates.length-1]) !== dateStr(d)) uniqueDates.push(d); }

      if (uniqueDates.length === 1) {
        const it = bucket.items[0];
        singles.push({
          groupId: it.groupId,
          teacherId: it.teacherId,
          studyPlanId: it.studyPlanId,
          subject: it.subject,
          startTime: it.startTime,
          endTime: it.endTime,
          date: dateStr(uniqueDates[0]),
          repeat: 'once',
          excludedDates: [],
          isTemplate: false,
          roomId: it.roomId,
          roomType: it.roomType,
          roomCapacity: it.roomCapacity,
        });
        continue;
      }

      const first = uniqueDates[0];
      const last = uniqueDates[uniqueDates.length-1];
      const weekday = dayOfWeek(first);
      const sameWeekday = uniqueDates.every(d => dayOfWeek(d) === weekday);
      if (!sameWeekday) {
        for (const it of bucket.items) {
          singles.push({
            groupId: it.groupId,
            teacherId: it.teacherId,
            studyPlanId: it.studyPlanId,
            subject: it.subject,
            startTime: it.startTime,
            endTime: it.endTime,
            date: it.date,
            repeat: 'once',
            excludedDates: [],
            isTemplate: false,
            roomId: it.roomId,
            roomType: it.roomType,
            roomCapacity: it.roomCapacity,
          });
        }
        continue;
      }

      const startPeriod = toDate(params.startDate);
      const weekIndex = (d: Date) => Math.floor(diffDays(startPeriod, d) / 7);
      const weeks = uniqueDates.map(weekIndex);
      const parity = weeks[0] % 2;
      const biweeklyCandidate = weeks.every(w => w % 2 === parity);
      const hasAdjacentWeeks = weeks.some((w,i)=> i>0 && weeks[i-1] === w-1);
      let repeat: 'weekly' | 'biweekly' = 'weekly';
      if (biweeklyCandidate && !hasAdjacentWeeks) repeat = 'biweekly';

      const expectedDates: string[] = [];
      const step = repeat === 'weekly' ? 7 : 14;
      for (let d = new Date(first); d.getTime() <= last.getTime(); d.setDate(d.getDate()+step)) {
        expectedDates.push(dateStr(d));
      }
      const actualSet = new Set(uniqueDates.map(d=>dateStr(d)));
      const excluded = expectedDates.filter(ed => !actualSet.has(ed));
      const any = bucket.items[0];
      templates.push({
        groupId: any.groupId,
        teacherId: any.teacherId,
        studyPlanId: any.studyPlanId,
        subject: any.subject,
        startTime: any.startTime,
        endTime: any.endTime,
        dayOfWeek: weekday,
        startDate: dateStr(first),
        endDate: dateStr(last),
        repeat,
        excludedDates: excluded,
        isTemplate: true,
        roomId: any.roomId,
        roomType: any.roomType,
        roomCapacity: any.roomCapacity,
      });
    }
    return { templates, singles };
  }

  // --- New fast try methods using DayIdx ---

  private tryMoveRandomToAnotherSlot(plan: DraftItem[], timeSlotsByDate: Map<string, { start: string; end: string }[]>, dayIdx: Map<string, DayIdx>, params: OptimizerParams): boolean {
    if (!plan.length) return false;
    const idx = Math.floor(Math.random() * plan.length);
    const it = plan[idx];
    const day = dayIdx.get(it.date);
    if (!day) return false;

    // Free current slot
    this.occupy(it, day, false);

    // Try random other slot on same day or different day
    const dates = this._datesCache ?? (this._datesCache = Array.from(timeSlotsByDate.keys()));
    const newDate = dates[Math.floor(Math.random()*dates.length)];
    const slots = timeSlotsByDate.get(newDate);
    const slot = slots[Math.floor(Math.random()*slots.length)];
    const newSlot = { start: slot.start, end: slot.end, date: newDate };
    const newDay = dayIdx.get(newSlot.date);
    if (!newDay) {
      this.occupy(it, day, true); // revert
      return false;
    }

    const newIt = { ...it, date: newSlot.date, startTime: newSlot.start, endTime: newSlot.end };
    if (this.canPlace(newIt, newDay, params)) {
      // Apply move
      plan[idx] = newIt;
      this.occupy(newIt, newDay, true);
      return true;
    } else {
      // Revert
      this.occupy(it, day, true);
      return false;
    }
  }

  private tryChangeRandomRoom(plan: DraftItem[], classrooms: Classroom[], dayIdx: Map<string, DayIdx>, params: OptimizerParams): boolean {
    if (!plan.length) return false;
    const idx = Math.floor(Math.random() * plan.length);
    const it = plan[idx];
    const day = dayIdx.get(it.date);
    if (!day) return false;

    // Free current room
    this.occupy(it, day, false);

    // Try random other room
    const s = day.slotByStart.get(it.startTime);
    if (s == null) {
      this.occupy(it, day, true); // revert
      return false;
    }
    const availableRooms = classrooms.filter(c => (it.groupSize ? c.capacity >= it.groupSize : true) && !day.roomBusy.get(c.id)?.[s]);
    if (!availableRooms.length) {
      this.occupy(it, day, true); // revert
      return false;
    }
    const newRoom = availableRooms[Math.floor(Math.random() * availableRooms.length)];
    const newIt = { ...it, roomId: newRoom.id, roomType: newRoom.type, roomCapacity: newRoom.capacity };

    if (this.canPlace(newIt, day, params)) {
      // Apply change
      plan[idx] = newIt;
      this.occupy(newIt, day, true);
      return true;
    } else {
      // Revert
      this.occupy(it, day, true);
      return false;
    }
  }

  private trySwapTwoItems(plan: DraftItem[], dayIdx: Map<string, DayIdx>, params: OptimizerParams): boolean {
    if (plan.length < 2) return false;
    const idx1 = Math.floor(Math.random() * plan.length);
    let idx2 = Math.floor(Math.random() * plan.length);
    while (idx2 === idx1) idx2 = Math.floor(Math.random() * plan.length);

    const it1 = plan[idx1];
    const it2 = plan[idx2];
    const day1 = dayIdx.get(it1.date);
    const day2 = dayIdx.get(it2.date);
    if (!day1 || !day2) return false;

    // Free both
    this.occupy(it1, day1, false);
    this.occupy(it2, day2, false);

    // Swap slots/rooms
    const swapped1 = { ...it1, date: it2.date, startTime: it2.startTime, endTime: it2.endTime, roomId: it2.roomId, roomType: it2.roomType, roomCapacity: it2.roomCapacity };
    const swapped2 = { ...it2, date: it1.date, startTime: it1.startTime, endTime: it1.endTime, roomId: it1.roomId, roomType: it1.roomType, roomCapacity: it1.roomCapacity };

    if (this.canPlace(swapped1, day2, params) && this.canPlace(swapped2, day1, params)) {
      // Apply swap
      plan[idx1] = swapped1;
      plan[idx2] = swapped2;
      this.occupy(swapped1, day2, true);
      this.occupy(swapped2, day1, true);
      return true;
    } else {
      // Revert
      this.occupy(it1, day1, true);
      this.occupy(it2, day2, true);
      return false;
    }
  }

  private forceFixLunchOverlaps(
    plan: DraftItem[],
    slotsByDate: Map<string, { start: string; end: string }[]>,
    classrooms: Classroom[],
    existingByDate: Map<string, any[]>,
    vacationsByTeacher: Map<number, any[]>,
    roomById: Map<string, Classroom>,
    minBreakMinutes: number,
    params: OptimizerParams,
    dayIdx: Map<string, DayIdx>
  ): DraftItem[] {
    const out: DraftItem[] = [];
    const lunch = params.lunchBreakTime;
    const dates = Array.from(slotsByDate.keys()).sort();

    for (const it of plan) {
      if (!this.overlap(it.startTime, it.endTime, lunch.start, lunch.end)) {
        out.push(it);
        continue;
      }
      // пробуем слоты в этот день, исключая обед
      const idx = dayIdx.get(it.date);
      const daySlots = (slotsByDate.get(it.date) || [])
        .filter(s => !this.overlap(s.start, s.end, lunch.start, lunch.end));
      let placed: DraftItem | null = null;

      if (idx) {
        for (const s of daySlots) {
          const cand = { ...it, startTime: s.start, endTime: s.end };
          // при конфликте аудитории — подберём другую
          if (cand.roomId && idx.roomBusy.get(Number(cand.roomId))?.[idx.slotByStart.get(s.start)]) {
            for (const r of classrooms.filter(c => (it.groupSize ? c.capacity >= it.groupSize : true))) {
              const withRoom = { ...cand, roomId: String(r.id), roomType: r.type, roomCapacity: r.capacity };
              if (this.canPlace(withRoom, idx, params)) { placed = withRoom; break; }
            }
          } else if (this.canPlace(cand, idx, params)) {
            placed = cand;
          }
          if (placed) break;
        }
      }

      // если не получилось — ищем ближайший рабочий день
      if (!placed) {
        const curIdx = dates.indexOf(it.date);
        const order = [...dates.slice(curIdx+1), ...dates.slice(0, curIdx)];
        for (const d of order) {
          const di = dayIdx.get(d);
          if (!di) continue;
          for (const s of (slotsByDate.get(d) || []).filter(s => !this.overlap(s.start, s.end, lunch.start, lunch.end))) {
            const cand = { ...it, date: d, startTime: s.start, endTime: s.end };
            if (this.canPlace(cand, di, params)) { placed = cand; break; }
          }
          if (placed) break;
        }
      }

      if (placed) out.push(placed);
      // иначе — выкидываем, чтобы не возвращать нарушение
    }
    return out;
  }

  private toLocalDateStr(d: Date) {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Almaty', year:'numeric', month:'2-digit', day:'2-digit'}).format(d);
  }
}

// Вспомогательный интерфейс для результата агрегирования
export interface AggregatedRecurringItem {
  groupId: number;
  teacherId: number;
  studyPlanId?: number;
  subject: string;
  startTime: string;
  endTime: string;
  dayOfWeek?: number;
  date?: string;
  startDate?: string;
  endDate?: string;
  repeat: 'weekly' | 'biweekly' | 'once';
  excludedDates: string[];
  isTemplate: boolean;
  roomId?: string | number;
  roomType?: string;
  roomCapacity?: number;
}
