import { useState, useEffect, useCallback, useMemo } from 'react';
import { feedbackService, EmotionalOverview } from '../services/feedbackService';
import { studentService, Student } from '../services/studentService';

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
  date: string;
  title: string;
  mood: number;
  stress: number;
  engagement: number;
}

const STRESS_ATTENTION_THRESHOLD = 70;

function clamp(v: number) {
  return Math.max(0, Math.min(100, Math.round(v)));
}

export function useEmotionalAnalysis() {
  const [filter, setFilter] = useState<{ period?: 'week' | 'month' | 'quarter' | 'year'; dateFrom?: string; dateTo?: string }>({ period: 'month' });
  const [selectedGroup, setSelectedGroup] = useState<string>('all');

  const [loading, setLoading] = useState(true);
  const [loadingRefresh, setLoadingRefresh] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Новые реальные данные
  const [overview, setOverview] = useState<EmotionalOverview | null>(null);

  // Списки студентов (для списка "внимание" и деталей)
  const [students, setStudents] = useState<Student[]>([]);
  const [attentionStudents, setAttentionStudents] = useState<RiskStudent[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [globalAverages, setGlobalAverages] = useState<{
    mood: number;
    stress: number;
    engagement: number;
  } | null>(null);

  // server pagination
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
    { label: 'Акад. четверть', value: 'quarter' },
    { label: 'Год', value: 'year' }
  ];

  // Основная загрузка данных
  const loadData = useCallback(async (opts?: { silent?: boolean }) => {
    try {
      if (!opts?.silent) setLoading(true); else setLoadingRefresh(true);
      setError(null);

      const days =
        filter.period === 'week' ? 7 :
        filter.period === 'month' ? 30 :
        filter.period === 'quarter' ? 90 :
        filter.period === 'year' ? 365 : 30;

      const [overviewData, paginatedRes] = await Promise.all([
        feedbackService.getEmotionalOverview(days).catch(() => null),
        studentService.getPaginatedStudents({ page: studentPage, limit: studentLimit }).catch(() => { throw new Error('Ошибка загрузки списка студентов'); })
      ]);

      if (overviewData) {
        // Санитизация engagement: если NaN/undefined/inf -> берём среднее мотивации и социализации, иначе 0
        const safeNum = (v: any) => typeof v === 'number' && isFinite(v) ? v : undefined;
        let engagement = safeNum(overviewData.averages.engagement);
        if (engagement === undefined) {
          const mot = safeNum(overviewData.averages.motivation);
            const soc = safeNum(overviewData.averages.socialization);
          if (mot !== undefined && soc !== undefined) {
            engagement = Math.round((mot + soc) / 2);
          } else {
            engagement = 0;
          }
        }

        // Создаём "очищенную" копию overview только для клиентской логики (оригинал сохраняем как есть)
        setOverview({
          ...overviewData,
          averages: {
            ...overviewData.averages,
            engagement
          }
        });

        setGlobalAverages({
          mood: overviewData.averages.mood,
          stress: overviewData.averages.stress,
          engagement
        });

        // lastUpdated берём из последнего дня таймлайна либо since
        const tl = overviewData.timeline;
        if (tl && tl.length > 0) {
          setLastUpdated(tl[tl.length - 1].date);
        } else {
          setLastUpdated(overviewData.since?.slice(0, 10) || null);
        }
      } else {
        setOverview(null);
        setGlobalAverages(null);
        setLastUpdated(null);
      }

      const studentsData = paginatedRes.data;
      setTotalStudents(paginatedRes.total);
      setTotalPages(paginatedRes.totalPages);
      setStudents(studentsData);

      // Attention students (только реальные данные; без моков)
      const att: RiskStudent[] = studentsData.map<RiskStudent>(st => {
        const es: any = (st as any).EmotionalState;
        if (!es) {
          return {
            student: st,
            source: 'feedback' as const
          };
        }
        const mood = es.mood ?? 0;
        const motivation = es.motivation ?? 0;
        const concentration = es.concentration ?? 0;
        const socialization = es.socialization ?? 0;
        const stress = clamp(100 - (mood + motivation) / 2);
        const engagement = clamp((motivation + socialization) / 2);
        return {
          student: st,
          mood,
          motivation,
          concentration,
          socialization,
          stress,
          engagement,
          updatedAt: es.updatedAt,
          source: 'feedback' as const
        };
      })
        .filter(r => (r.stress ?? 0) >= STRESS_ATTENTION_THRESHOLD)
        .sort((a, b) => (b.stress! - a.stress!))
        .slice(0, 30);
      setAttentionStudents(att);
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

  // Детали студента (используем существующий API, без моков)
  const openStudentDetails = async (studentId: number) => {
    setSelectedStudentId(studentId);
    setSelectedStudentDetails({ loading: true, error: null, emotional: null });
    try {
      // Переиспользуем старый сервис (он уже может быть привязан к бэкенду)
      const emotional = await studentService.getStudentEmotionalState(studentId).catch(() => null);
      setSelectedStudentDetails({ loading: false, error: null, emotional });
    } catch (e: any) {
      setSelectedStudentDetails({ loading: false, error: e.message || 'Ошибка', emotional: null });
    }
  };

  const closeStudentDetails = () => {
    setSelectedStudentId(null);
    setSelectedStudentDetails({ loading: false, error: null, emotional: null });
  };

  // Список уникальных групп (из студентов – реальные данные)
  const groups = useMemo(() => {
    const set = new Set<string>();
    students.forEach(s => {
      if (s.group?.name) set.add(s.group.name);
    });
    return Array.from(set).sort();
  }, [students]);

  // Group stats (берём напрямую из overview)
  const filteredGroupStats = useMemo(() => {
    if (!overview) return [];
    if (selectedGroup === 'all') {
      return overview.groupStats
        .map(g => ({
          group: g.group,
          students: g.students,
          averageMood: g.averageMood,
          averageStress: g.averageStress,
          averageEngagement: g.averageEngagement
        }))
        .sort((a, b) => a.group.localeCompare(b.group));
    }
    return overview.groupStats
      .filter(g => g.group === selectedGroup)
      .map(g => ({
        group: g.group,
        students: g.students,
        averageMood: g.averageMood,
        averageStress: g.averageStress,
        averageEngagement: g.averageEngagement
      }));
  }, [overview, selectedGroup]);

  // Реальные события/таймлайн: пока просто агрегированные точки без названий событий
  const events: EventImpact[] = useMemo(() => {
    if (!overview) return [];
    return overview.timeline.map(t => {
      const safeEng = (typeof t.engagement === 'number' && isFinite(t.engagement)) ? t.engagement : 0;
      return {
        date: t.date,
        title: 'Агрегация',
        mood: clamp(t.mood),
        stress: clamp(t.stress),
        engagement: clamp(safeEng)
      };
    });
  }, [overview]);

  // Экспорт CSV (адаптирован к overview)
  const exportGroupsCSV = () => {
    if (!overview) return;
    const headers = ['группа', 'студенты', 'ср_настроение', 'ср_стресс', 'ср_вовлеченность'];
    const rows = overview.groupStats.map(g => [
      g.group,
      g.students,
      g.averageMood,
      g.averageStress,
      g.averageEngagement
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

  // Excel export (минимальная адаптация — можно расширить позже)
  const exportExcel = async () => {
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();

    if (overview) {
      const groupSheetData = [
        ['Группа', 'Студенты', 'Настроение', 'Стресс', 'Вовлеченность'],
        ...overview.groupStats.map(g => [
          g.group, g.students, g.averageMood, g.averageStress, g.averageEngagement
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

    XLSX.writeFile(wb, 'эмоциональный_анализ.xlsx');
  };

  return {
    loading,
    loadingRefresh,
    error,
    filter,
    selectedGroup,
    setSelectedGroup,
    emotionalLoyalty: null, // legacy field (для совместимости)
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
    changePeriod,
    refetch,
    openStudentDetails,
    closeStudentDetails,
    exportGroupsCSV,
    exportRiskCSV,
    exportExcel,
    studentPage,
    studentLimit,
    totalPages,
    totalStudents,
    setStudentPage,
    setStudentLimit,
  };
}
