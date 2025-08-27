/**
 * Утилиты для вычисления учебных четвертей (академический год начинается в сентябре).
 * Закрепленные границы (2025-2026) с поддержкой автоматического вычисления для любого года.
 *
 * Q1: 02.09 – 26.10
 * Осенние каникулы: 27.10 – 02.11
 * Q2: 03.11 – 28.12
 * Зимние каникулы: 29.12 – 07.01 (следующий календарный год)
 * Q3: 08.01 – 18.03
 * Весенние каникулы: 19.03 – 29.03
 * Q4: 30.03 – 25.05
 *
 * Если текущая дата попадает в каникулы, возвращается предыдущая завершённая четверть.
 * Если лето после окончания Q4 – возвращается Q4 (последняя четверть учебного года).
 */

export interface AcademicQuarterRange {
  index: 1 | 2 | 3 | 4;
  start: Date;
  end: Date;
  label: string;
}

interface AcademicVacations {
  autumn: { start: Date; end: Date };
  winter: { start: Date; end: Date };
  spring: { start: Date; end: Date };
}

/**
 * Определяет год начала учебного года (год сентября) для заданной даты.
 */
export function getAcademicYearStartYear(d: Date): number {
  const year = d.getFullYear();
  return d.getMonth() >= 8 ? year : year - 1; // месяц >= 8 (сентябрь=8)
}

/**
 * Возвращает диапазоны учебных четвертей и каникул для даты (используется её учебный год).
 */
export function getAcademicQuarterRanges(now: Date = new Date()): {
  quarters: AcademicQuarterRange[];
  vacations: AcademicVacations;
  academicYearStartYear: number;
} {
  const academicYearStartYear = getAcademicYearStartYear(now);

  const q1Start = new Date(academicYearStartYear, 8, 2);
  const q1End = new Date(academicYearStartYear, 9, 26, 23, 59, 59);
  const autumnVacationStart = new Date(academicYearStartYear, 9, 27);
  const autumnVacationEnd = new Date(academicYearStartYear, 10, 2, 23, 59, 59);

  const q2Start = new Date(academicYearStartYear, 10, 3);
  const q2End = new Date(academicYearStartYear, 11, 28, 23, 59, 59);
  const winterVacationStart = new Date(academicYearStartYear, 11, 29);
  const winterVacationEnd = new Date(academicYearStartYear + 1, 0, 7, 23, 59, 59);

  const q3Start = new Date(academicYearStartYear + 1, 0, 8);
  const q3End = new Date(academicYearStartYear + 1, 2, 18, 23, 59, 59);
  const springVacationStart = new Date(academicYearStartYear + 1, 2, 19);
  const springVacationEnd = new Date(academicYearStartYear + 1, 2, 29, 23, 59, 59);

  const q4Start = new Date(academicYearStartYear + 1, 2, 30);
  const q4End = new Date(academicYearStartYear + 1, 4, 25, 23, 59, 59);

  const quarters: AcademicQuarterRange[] = [
    { index: 1, start: q1Start, end: q1End, label: 'school_quarter_1' },
    { index: 2, start: q2Start, end: q2End, label: 'school_quarter_2' },
    { index: 3, start: q3Start, end: q3End, label: 'school_quarter_3' },
    { index: 4, start: q4Start, end: q4End, label: 'school_quarter_4' }
  ];

  const vacations: AcademicVacations = {
    autumn: { start: autumnVacationStart, end: autumnVacationEnd },
    winter: { start: winterVacationStart, end: winterVacationEnd },
    spring: { start: springVacationStart, end: springVacationEnd }
  };

  return { quarters, vacations, academicYearStartYear };
}

/**
 * Возвращает диапазон текущей учебной четверти. Во время каникул – предыдущая завершённая.
 * Летом (до начала следующего учебного года) – последняя (Q4).
 */
export function getCurrentAcademicQuarterRange(now: Date = new Date()): AcademicQuarterRange {
  const { quarters, vacations } = getAcademicQuarterRanges(now);

  const hit = quarters.find(q => now >= q.start && now <= q.end);
  if (hit) return hit;

  // КАНИКУЛЫ => вернуть предыдущую четверть
  if (now >= vacations.autumn.start && now <= vacations.autumn.end) {
    return quarters[0];
  }
  if (now >= vacations.winter.start && now <= vacations.winter.end) {
    return quarters[1];
  }
  if (now >= vacations.spring.start && now <= vacations.spring.end) {
    return quarters[2];
  }

  // ЛЕТО (после q4End до следующего q1Start)
  return quarters[3];
}

/**
 * Возвращает дату начала следующей учебной четверти (для планирования пересчётов).
 */
export function getNextAcademicQuarterStart(now: Date = new Date()): Date {
  const { quarters } = getAcademicQuarterRanges(now);

  // Следующий старт после текущего момента
  for (const q of quarters) {
    if (now < q.start) return q.start;
  }

  // Все начались — следующий учебный год (Q1)
  const nextYearRef = new Date(quarters[0].start);
  nextYearRef.setFullYear(nextYearRef.getFullYear() + 1);
  // Перестраиваем для нового года
  const { quarters: nextYearQuarters } = getAcademicQuarterRanges(new Date(nextYearRef.getFullYear(), 8, 1));
  return nextYearQuarters[0].start;
}

/**
 * Возвращает диапазон по номеру учебной четверти (1..4) для года начала учебного года.
 * @param index 1..4
 * @param academicYearStartYear год сентября (например 2025 для 2025-2026)
 */
export function getAcademicQuarterByIndex(index: 1 | 2 | 3 | 4, academicYearStartYear: number): AcademicQuarterRange {
  const probeDate = new Date(academicYearStartYear, 8, 15); // середина сентября
  const { quarters } = getAcademicQuarterRanges(probeDate);
  const found = quarters.find(q => q.index === index);
  if (!found) {
    throw new Error(`Academic quarter ${index} not found for year ${academicYearStartYear}`);
  }
  return found;
}
