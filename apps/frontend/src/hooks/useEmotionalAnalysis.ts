import { useState, useEffect, useCallback, useMemo } from 'react';
import { loyaltyService } from '../services/loyaltyService';
import { studentService, Student } from '../services/studentService';
import { EmotionalLoyalty, LoyaltyFilter } from '../types/loyalty';

/**
 * Расчет дополнительных производных метрик (стресс, вовлеченность) детерминированно.
 * Блок событий тоже генерируется детерминированно.
 */

export interface RiskStudent {
  student: Student;
  mood?: number;
  motivation?: number;
  concentration?: number;
  socialization?: number;
  stress?: number;
  engagement?: number;
  updatedAt?: string;
  source?: 'feedback' | 'legacy';
}

export interface SelectedStudentDetails {
  loading: boolean;
  error: string | null;
  emotional: any | null;
}

export interface EventImpact {
  date: string; // ISO YYYY-MM-DD
  title: string;
  mood: number;
  stress: number;
  engagement: number;
}

const RISK_THRESHOLD_LEGACY = 40; // для старого отбора (не используется в новой карточке)
const STRESS_ATTENTION_THRESHOLD = 70; // критерий для "Ученики, требующие внимания"

const MOCK_EMOTIONAL = true;

function hashCode(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function clamp(v: number) {
  return Math.max(0, Math.min(100, Math.round(v)));
}

export function useEmotionalAnalysis() {
  const [filter, setFilter] = useState<LoyaltyFilter>({ period: 'month' });
  const [selectedGroup, setSelectedGroup] = useState<string>('all');

  const [loading, setLoading] = useState(true);
  const [loadingRefresh, setLoadingRefresh] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [emotionalLoyalty, setEmotionalLoyalty] = useState<EmotionalLoyalty | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [attentionStudents, setAttentionStudents] = useState<RiskStudent[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [globalAverages, setGlobalAverages] = useState<{
    mood: number;
    motivation: number;
    satisfaction: number;
    stress: number;
    engagement: number;
  } | null>(null);

  // server pagination (оставляем если понадобится)
  const [studentPage, setStudentPage] = useState(1);
  const [studentLimit, setStudentLimit] = useState(100);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [selectedStudentDetails, setSelectedStudentDetails] = useState<SelectedStudentDetails>({
    loading: false,
    error: null,
    emotional: null
  });

  const periodOptions: Array<{ label: string; value: 'week' | 'month' | 'quarter' | 'year' }> = [
    { label: 'Неделя', value: 'week' },
    { label: 'Месяц', value: 'month' },
    { label: 'Квартал', value: 'quarter' },
  ];

  /**
   * Генерация/дополнение эмоционального состояния для студента (мок).
   */
  function ensureEmotionalState(st: Student): Student {
    if (st.EmotionalState) return st;
    if (!MOCK_EMOTIONAL) return st;
    const gName = st.group?.name || 'NO_GROUP';
    const seed = hashCode(`${gName}-${st.id}`);
    const mood = seed % 100;
    const motivation = (seed * 7) % 100;
    const concentration = (seed * 13) % 100;
    const socialization = (seed * 17) % 100;
    (st as any).EmotionalState = {
      mood,
      motivation,
      concentration,
      socialization,
      updatedAt: new Date().toISOString(),
      // заполнение полей описаний/трендов (если где-то ожидаются)
      moodDesc: '',
      moodTrend: 'neutral',
      concentrationDesc: '',
      concentrationTrend: 'neutral',
      socializationDesc: '',
      socializationTrend: 'neutral',
      motivationDesc: '',
      motivationTrend: 'neutral'
    };
    return st;
  }

  /**
   * Расчет производных метрик stress / engagement детерминированно.
   * stress базируется на mood/motivation + шум от hash.
   * engagement = среднее motivation & socialization.
   */
  function computeDerived(es: Student['EmotionalState'], seedKey: string) {
    if (!es) return { stress: undefined, engagement: undefined };
    const baseAvg = (es.mood + es.motivation) / 2;
    let stress = 100 - baseAvg; // инверсия
    const jitter = (hashCode(seedKey) % 15) - 7; // [-7..7]
    stress = clamp(stress + jitter);
    const engagement = clamp((es.motivation + es.socialization) / 2);
    return { stress, engagement };
  }

  const loadData = useCallback(async (opts?: { silent?: boolean }) => {
    try {
      if (!opts?.silent) setLoading(true); else setLoadingRefresh(true);
      setError(null);

      const [loyaltyData, paginatedRes] = await Promise.all([
        loyaltyService.getEmotionalLoyalty(filter).catch(() => null),
        studentService.getPaginatedStudents({ page: studentPage, limit: studentLimit }).catch(() => { throw new Error('Ошибка загрузки списка студентов'); })
      ]);

      const studentsData = paginatedRes.data.map(s => ensureEmotionalState(s));
      setTotalStudents(paginatedRes.total);
      setTotalPages(paginatedRes.totalPages);
      setStudents(studentsData);

      // Групповая агрегация (мок если данных нет)
      const groupStats: Array<{
        group: string;
        students: number;
        averageMood: number;
        averageMotivation: number;
        loyaltyScore: number;
        averageStress: number;
        averageEngagement: number;
      }> = [];

      const groupsMap = new Map<string, Student[]>();
      studentsData.forEach(st => {
        const g = st.group?.name || 'NO_GROUP';
        if (!groupsMap.has(g)) groupsMap.set(g, []);
        groupsMap.get(g)!.push(st);
      });

      groupsMap.forEach((list, group) => {
        const moodAvg = Math.round(list.reduce((s, st) => s + (st.EmotionalState?.mood || 0), 0) / list.length);
        const motivationAvg = Math.round(list.reduce((s, st) => s + (st.EmotionalState?.motivation || 0), 0) / list.length);
        const engagementAvg = Math.round(list.reduce((s, st) => s + ((st.EmotionalState ? (st.EmotionalState.motivation + st.EmotionalState.socialization) / 2 : 0)), 0) / list.length);
        const stressAvgRaw = list.reduce((s, st) => {
          const { stress } = computeDerived(st.EmotionalState, `g-${group}-${st.id}`);
            return s + (stress || 0);
        }, 0) / list.length;
        const stressAvg = Math.round(stressAvgRaw);
        const loyaltyScore = Math.round((moodAvg + motivationAvg) / 2);
        groupStats.push({
          group,
          students: list.length,
          averageMood: moodAvg,
          averageMotivation: motivationAvg,
          loyaltyScore,
          averageStress: stressAvg,
          averageEngagement: engagementAvg
        });
      });

      groupStats.sort((a, b) => a.group.localeCompare(b.group));

      const averages = {
        mood: Math.round(groupStats.reduce((s, g) => s + g.averageMood, 0) / Math.max(1, groupStats.length)),
        motivation: Math.round(groupStats.reduce((s, g) => s + g.averageMotivation, 0) / Math.max(1, groupStats.length)),
        satisfaction: Math.round(groupStats.reduce((s, g) => s + g.loyaltyScore, 0) / Math.max(1, groupStats.length)),
        stress: Math.round(groupStats.reduce((s, g) => s + g.averageStress, 0) / Math.max(1, groupStats.length)),
        engagement: Math.round(groupStats.reduce((s, g) => s + g.averageEngagement, 0) / Math.max(1, groupStats.length)),
      };

      // Динамика (мок) на основе mood/motivation
      const emotionalStates = Array.from({ length: 8 }).map((_, i) => ({
        mood: clamp(averages.mood + (i - 4) * 2 + ((i % 3) - 1) * 3),
        motivation: clamp(averages.motivation + (i - 4) * 2 + ((i % 4) - 2) * 2),
        // для совместимости
      }));

      const mockLoyalty: EmotionalLoyalty = loyaltyData || {
        totalStudents: paginatedRes.total,
        averages: {
          mood: averages.mood,
          motivation: averages.motivation,
          satisfaction: averages.satisfaction
        },
        groupStats: groupStats.map(g => ({
          group: g.group,
          students: g.students,
          averageMood: g.averageMood,
          averageMotivation: g.averageMotivation,
          loyaltyScore: g.loyaltyScore
        })),
        emotionalStates
      };

      setEmotionalLoyalty(mockLoyalty);
      setGlobalAverages(averages);

      // Отбор учеников требующих внимания по стрессу
      const att: RiskStudent[] = studentsData.map(st => {
        const { stress, engagement } = computeDerived(st.EmotionalState, `s-${st.id}`);
        return {
          student: st,
          mood: st.EmotionalState?.mood,
          motivation: st.EmotionalState?.motivation,
          concentration: st.EmotionalState?.concentration,
          socialization: st.EmotionalState?.socialization,
          stress,
          engagement,
          updatedAt: st.EmotionalState?.updatedAt,
          source: 'legacy' as const
        };
      }).filter(r => (r.stress ?? 0) >= STRESS_ATTENTION_THRESHOLD)
        .sort((a, b) => (b.stress! - a.stress!))
        .slice(0, 30);
      setAttentionStudents(att);

      // Последнее обновление: максимум updatedAt
      const maxUpdated = studentsData
        .map(s => s.EmotionalState?.updatedAt)
        .filter(Boolean)
        .sort()
        .pop() || new Date().toISOString();
      setLastUpdated(maxUpdated.slice(0, 10));
    } catch (e: any) {
      setError(e.message || 'Ошибка');
    } finally {
      setLoading(false);
      setLoadingRefresh(false);
    }
  }, [filter, studentPage, studentLimit]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const changePeriod = (period: 'week' | 'month' | 'quarter' | 'year') => {
    if (period === 'week') {
      const now = new Date();
      const dateTo = now.toISOString().slice(0, 10);
      const from = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
      const dateFrom = from.toISOString().slice(0, 10);
      setFilter(f => ({ ...f, period: undefined, dateFrom, dateTo }));
    } else {
      setFilter(f => ({ ...f, period, dateFrom: undefined, dateTo: undefined }));
    }
  };

  const refetch = () => loadData({ silent: true });

  // Детали студента (оставляем как было + совместимость)
  const openStudentDetails = async (studentId: number) => {
    setSelectedStudentId(studentId);
    setSelectedStudentDetails({ loading: true, error: null, emotional: null });
    try {
      let emotional = await studentService.getStudentEmotionalState(studentId).catch(() => null);
      if (!emotional || !emotional.currentState) {
        const st = students.find(s => s.id === studentId);
        if (st) {
          const seed = hashCode(`detail-${st.id}`);
          const mood = seed % 100;
          const motivation = (seed * 7) % 100;
          const concentration = (seed * 11) % 100;
          const socialization = (seed * 13) % 100;
          emotional = {
            student: st.id,
            currentState: {
              mood: { value: mood, description: 'Авто (мок)', trend: 'neutral' },
              motivation: { value: motivation, description: 'Авто (мок)', trend: 'neutral' },
              concentration: { value: concentration, description: 'Авто (мок)', trend: 'neutral' },
              socialization: { value: socialization, description: 'Авто (мок)', trend: 'neutral' },
              lastUpdated: new Date().toISOString()
            },
            feedbackHistory: [],
            trends: {
              mood: 'neutral',
              motivation: 'neutral',
              concentration: 'neutral',
              socialization: 'neutral'
            },
            recommendations: []
          };
        }
      }
      setSelectedStudentDetails({ loading: false, error: null, emotional });
    } catch (e: any) {
      setSelectedStudentDetails({ loading: false, error: e.message || 'Ошибка', emotional: null });
    }
  };

  const closeStudentDetails = () => {
    setSelectedStudentId(null);
    setSelectedStudentDetails({ loading: false, error: null, emotional: null });
  };

  // CSV export (оставляем прежние, можно позже адаптировать)
  const exportGroupsCSV = () => {
    if (!emotionalLoyalty) return;
    const headers = ['группа', 'студенты', 'ср_настроение', 'ср_мотивация', 'индекс_лояльности'];
    const rows = emotionalLoyalty.groupStats.map(g => [
      g.group,
      g.students,
      g.averageMood,
      g.averageMotivation,
      g.loyaltyScore
    ]);
    downloadCSV([headers, ...rows], 'группы_эмоциональный.csv');
  };

  const exportRiskCSV = () => {
    const headers = ['id_студента', 'имя', 'группа', 'настроение', 'мотивация', 'концентрация', 'социализация', 'стресс', 'вовлеченность', 'обновлено'];
    const rows = attentionStudents.map(r => [
      r.student.id,
      `${r.student.user.name} ${r.student.user.surname}`,
      r.student.group?.name,
      r.mood ?? '',
      r.motivation ?? '',
      r.concentration ?? '',
      r.socialization ?? '',
      r.stress ?? '',
      r.engagement ?? '',
      r.updatedAt ?? ''
    ]);
    downloadCSV([headers, ...rows], 'ученики_внимание.csv');
  };

  const downloadCSV = (matrix: any[][], filename: string) => {
    const csv = matrix.map(r => r.map(cell => {
      const s = String(cell ?? '');
      if (/[",;\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    }).join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Excel export (оставляем старую реализацию, адаптируем к attentionStudents)
  const exportExcel = async () => {
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();

    // Собираем всех студентов (все страницы)
    let allStudents = students;
    if (totalStudents > students.length) {
      const pages = Math.ceil(totalStudents / studentLimit);
      const collected: Student[] = [];
      for (let p = 1; p <= pages; p++) {
        const res = await studentService.getPaginatedStudents({ page: p, limit: studentLimit });
        collected.push(...res.data.map(s => ensureEmotionalState(s)));
      }
      allStudents = collected;
    }

    // Группы
    if (emotionalLoyalty) {
      const groupSheetData = [
        ['Группа', 'Студенты', 'Настроение', 'Мотивация', 'Индекс лояльности'],
        ...emotionalLoyalty.groupStats.map(g => [
          g.group, g.students, g.averageMood, g.averageMotivation, g.loyaltyScore
        ])
      ];
      const wsGroups = XLSX.utils.aoa_to_sheet(groupSheetData);
      XLSX.utils.book_append_sheet(wb, wsGroups, 'Группы');
    }

    if (attentionStudents.length > 0) {
      const riskSheetData = [
        ['ID', 'Имя', 'Группа', 'Настроение', 'Мотивация', 'Концентрация', 'Социализация', 'Стресс', 'Вовлеченность', 'Обновлено'],
        ...attentionStudents.map(r => [
          r.student.id,
            `${r.student.user.name} ${r.student.user.surname}`,
            r.student.group?.name || '',
            r.mood ?? '',
            r.motivation ?? '',
            r.concentration ?? '',
            r.socialization ?? '',
            r.stress ?? '',
            r.engagement ?? '',
            r.updatedAt ?? ''
        ])
      ];
      const wsRisk = XLSX.utils.aoa_to_sheet(riskSheetData);
      XLSX.utils.book_append_sheet(wb, wsRisk, 'Внимание');
    }

    if (allStudents.length > 0) {
      const allSheetData = [
        ['ID', 'Имя', 'Группа', 'Настроение', 'Мотивация', 'Концентрация', 'Социализация', 'UpdatedAt'],
        ...allStudents.map(s => [
          s.id,
          `${s.user.name} ${s.user.surname}`,
          s.group?.name || '',
          s.EmotionalState?.mood ?? '',
          s.EmotionalState?.motivation ?? '',
          s.EmotionalState?.concentration ?? '',
          s.EmotionalState?.socialization ?? '',
          s.EmotionalState?.updatedAt || ''
        ])
      ];
      const wsAll = XLSX.utils.aoa_to_sheet(allSheetData);
      XLSX.utils.book_append_sheet(wb, wsAll, 'Студенты');
    }

    // По группам
    if (allStudents.length > 0) {
      const grouped = new Map<string, Student[]>();
      allStudents.forEach(s => {
        const g = s.group?.name || 'NO_GROUP';
        if (!grouped.has(g)) grouped.set(g, []);
        grouped.get(g)!.push(s);
      });
      const byGroupData: any[][] = [
        ['Группа', 'ID', 'Имя', 'Настроение', 'Мотивация', 'Концентрация', 'Социализация', 'UpdatedAt']
      ];
      Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0])).forEach(([g, list]) => {
        list.forEach(s => {
          byGroupData.push([
            g,
            s.id,
            `${s.user.name} ${s.user.surname}`,
            s.EmotionalState?.mood ?? '',
            s.EmotionalState?.motivation ?? '',
            s.EmotionalState?.concentration ?? '',
            s.EmotionalState?.socialization ?? '',
            s.EmotionalState?.updatedAt || ''
          ]);
        });
      });
      const wsGroupsStudents = XLSX.utils.aoa_to_sheet(byGroupData);
      XLSX.utils.book_append_sheet(wb, wsGroupsStudents, 'По_группам');
    }

    XLSX.writeFile(wb, 'эмоциональный_анализ.xlsx');
  };

  // Список уникальных групп
  const groups = useMemo(() => {
    const set = new Set<string>();
    students.forEach(s => {
      if (s.group?.name) set.add(s.group.name);
    });
    return Array.from(set).sort();
  }, [students]);

  // Фильтрованные данные групп (для правой панели)
  const filteredGroupStats = useMemo(() => {
    if (!emotionalLoyalty) return [];
    if (selectedGroup === 'all') {
      // enrich with stress/engagement (пересчёт)
      // Нужны расширенные groupStats – пересчитываем локально
      const map = new Map<string, { students: number; mood: number; motivation: number; list: Student[] }>();
      students.forEach(s => {
        const g = s.group?.name || 'NO_GROUP';
        if (!map.has(g)) map.set(g, { students: 0, mood: 0, motivation: 0, list: [] });
        const entry = map.get(g)!;
        entry.students += 1;
        entry.mood += s.EmotionalState?.mood || 0;
        entry.motivation += s.EmotionalState?.motivation || 0;
        entry.list.push(s);
      });
      return Array.from(map.entries()).map(([g, v]) => {
        const avgMood = Math.round(v.mood / v.students);
        const avgMot = Math.round(v.motivation / v.students);
        // derive stress/engagement
        const stressVals = v.list.map(st => computeDerived(st.EmotionalState, `g2-${g}-${st.id}`).stress || 0);
        const engageVals = v.list.map(st => computeDerived(st.EmotionalState, `g2-${g}-${st.id}`).engagement || 0);
        const avgStress = Math.round(stressVals.reduce((a, b) => a + b, 0) / Math.max(1, stressVals.length));
        const avgEngage = Math.round(engageVals.reduce((a, b) => a + b, 0) / Math.max(1, engageVals.length));
        return {
          group: g,
          students: v.students,
          averageMood: avgMood,
          averageStress: avgStress,
          averageEngagement: avgEngage
        };
      }).sort((a, b) => a.group.localeCompare(b.group));
    }
    return filteredGroupStatsAll(emotionalLoyalty, students, selectedGroup, computeDerived);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emotionalLoyalty, selectedGroup, students]);

  function filteredGroupStatsAll(
    _loyalty: EmotionalLoyalty,
    studs: Student[],
    group: string,
    derive: (es: Student['EmotionalState'], key: string) => { stress?: number; engagement?: number }
  ) {
    const list = studs.filter(s => (s.group?.name || 'NO_GROUP') === group);
    if (list.length === 0) return [];
    const moodAvg = Math.round(list.reduce((s, st) => s + (st.EmotionalState?.mood || 0), 0) / list.length);
    const stressVals = list.map(st => derive(st.EmotionalState, `fg-${group}-${st.id}`).stress || 0);
    const engageVals = list.map(st => derive(st.EmotionalState, `fg-${group}-${st.id}`).engagement || 0);
    const stressAvg = Math.round(stressVals.reduce((a, b) => a + b, 0) / stressVals.length);
    const engageAvg = Math.round(engageVals.reduce((a, b) => a + b, 0) / engageVals.length);
    return [{
      group,
      students: list.length,
      averageMood: moodAvg,
      averageStress: stressAvg,
      averageEngagement: engageAvg
    }];
  }

  // События и их влияние (детерминированно: последние 7 дней)
  const events: EventImpact[] = useMemo(() => {
    const titles = ['Научная конференция', 'Спортивные соревнования', 'Контрольная работа', 'Олимпиада'];
    const now = new Date();
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
      const date = d.toISOString().slice(0, 10);
      const seed = hashCode(`event-${date}`);
      const title = titles[seed % titles.length];
      const mood = clamp((emotionalLoyalty?.averages.mood || 70) + ((seed % 11) - 5));
      const stress = clamp(100 - mood + (seed % 9) - 4);
      const engagement = clamp((emotionalLoyalty?.averages.motivation || 65) + ((seed % 13) - 6));
      return { date, title, mood, stress, engagement };
    });
  }, [emotionalLoyalty]);

  return {
    // state
    loading,
    loadingRefresh,
    error,
    filter,
    selectedGroup,
    setSelectedGroup,
    emotionalLoyalty,
    students,
    attentionStudents,
    selectedStudentId,
    selectedStudentDetails,
    periodOptions,
    lastUpdated,
    events,
    filteredGroupStats,
    groups,
    globalAverages,
    // actions
    changePeriod,
    refetch,
    openStudentDetails,
    closeStudentDetails,
    exportGroupsCSV,
    exportRiskCSV,
    exportExcel,
    // pagination (если понадобится)
    studentPage,
    studentLimit,
    totalPages,
    totalStudents,
    setStudentPage,
    setStudentLimit,
  };
}
