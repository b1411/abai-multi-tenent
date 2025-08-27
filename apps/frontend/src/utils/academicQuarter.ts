/**
 * Академические четверти (фиксированные границы).
 * Q1: 02.09–26.10
 * Осенние: 27.10–02.11
 * Q2: 03.11–28.12
 * Зимние: 29.12–07.01
 * Q3: 08.01–18.03
 * Весенние: 19.03–29.03
 * Q4: 30.03–25.05
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

export function getAcademicYearStartYear(d: Date): number {
  return d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1;
}

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

export function getCurrentAcademicQuarterRange(now: Date = new Date()): AcademicQuarterRange {
  const { quarters, vacations } = getAcademicQuarterRanges(now);

  const hit = quarters.find(q => now >= q.start && now <= q.end);
  if (hit) return hit;

  if (now >= vacations.autumn.start && now <= vacations.autumn.end) return quarters[0];
  if (now >= vacations.winter.start && now <= vacations.winter.end) return quarters[1];
  if (now >= vacations.spring.start && now <= vacations.spring.end) return quarters[2];

  return quarters[3];
}

export function getAcademicQuarterByIndex(index: 1 | 2 | 3 | 4, academicYearStartYear: number): AcademicQuarterRange {
  const probe = new Date(academicYearStartYear, 8, 15);
  const { quarters } = getAcademicQuarterRanges(probe);
  const q = quarters.find(q => q.index === index);
  if (!q) throw new Error(`Quarter ${index} not found for ${academicYearStartYear}`);
  return q;
}

/**
 * Унифицированная функция заменяющая локальные реализации.
 * Возвращает текущую академическую четверть для даты (если каникулы — предыдущая).
 */
export function getAcademicQuarterForDate(date: Date): {
  index: 1 | 2 | 3 | 4;
  start: Date;
  end: Date;
  academicYearStartYear: number;
} {
  const { quarters, vacations, academicYearStartYear } = getAcademicQuarterRanges(date);

  let hit = quarters.find(q => date >= q.start && date <= q.end);

  if (!hit) {
    if (date >= vacations.autumn.start && date <= vacations.autumn.end) hit = quarters[0];
    else if (date >= vacations.winter.start && date <= vacations.winter.end) hit = quarters[1];
    else if (date >= vacations.spring.start && date <= vacations.spring.end) hit = quarters[2];
    else hit = quarters[3]; // лето
  }

  return { index: hit.index, start: hit.start, end: hit.end, academicYearStartYear };
}

export function formatAcademicQuarterIdentifier(academicYearStartYear: number, index: number): string {
  return `${academicYearStartYear} Q${index}`;
}
