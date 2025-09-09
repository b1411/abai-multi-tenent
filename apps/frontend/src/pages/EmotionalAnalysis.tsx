import React, { useMemo } from 'react';
import { useEmotionalAnalysis } from '../hooks/useEmotionalAnalysis';
import { useAuth } from '../hooks/useAuth';
import { Spinner } from '../components/ui/Spinner';
import { EMO_TREND_THRESHOLD } from '../constants/emotional';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';

const colorByValue = (v: number | undefined) => {
  if (v === undefined || v === null) return '';
  if (v < 40) return 'text-red-600';
  if (v < 70) return 'text-yellow-600';
  return 'text-green-600';
};

const barBg = (v: number | undefined) => {
  if (v === undefined || v === null) return 'bg-gray-200';
  if (v < 40) return 'bg-red-500';
  if (v < 70) return 'bg-yellow-500';
  return 'bg-green-500';
};

const stressMessage = (s?: number) => {
  if (s === undefined) return '';
  if (s >= 90) return 'Критически высокий стресс';
  if (s >= 80) return 'Очень высокий уровень стресса';
  if (s >= 70) return 'Высокий уровень стресса, требуется внимание';
  if (s >= 60) return 'Повышенный стресс';
  return 'Умеренный стресс';
};

const EmotionalAnalysisPage: React.FC = () => {
  const { hasRole } = useAuth();
  const {
    loading,
    loadingRefresh,
    error,
    filter,
    changePeriod,
    refetch,
    periodOptions,
    globalAverages,
    lastUpdated,
    events,
    filteredGroupStats,
    groups,
    selectedGroup,
    setSelectedGroup,
    attentionStudents,
    attentionStudentsByGroup,
    openStudentDetails,
    closeStudentDetails,
    selectedStudentId,
    selectedStudentDetails,
    totalStudents,
  } = useEmotionalAnalysis();

  // Выбираем итоговый список риск-студентов (fallback если по какой-то причине фильтр дал пусто при all)
  const riskStudents = useMemo(() => {
    if (selectedGroup === 'all') {
      // если all и отфильтрованный список пуст, используем оригинальный
      return attentionStudentsByGroup.length === 0 ? attentionStudents : attentionStudentsByGroup;
    }
    return attentionStudentsByGroup;
  }, [selectedGroup, attentionStudentsByGroup, attentionStudents]);

  // Готовим данные тренда до раннего return (чтобы не нарушать порядок хуков)
  const trendData = useMemo(() => {
    return events.map((e, i) => ({
      idx: i + 1,
      mood: e.mood,
      stress: e.stress,
      engagement: e.engagement
    }));
  }, [events]);

  const computeTrend = (series: (number | undefined)[]) => {
    if (series.length < 2) return 'neutral';
    const prev = series[series.length - 2];
    const curr = series[series.length - 1];
    if (prev == null || curr == null) return 'neutral';
    const diff = curr - prev;
    if (diff > EMO_TREND_THRESHOLD) return 'up';
    if (diff < -EMO_TREND_THRESHOLD) return 'down';
    return 'neutral';
  };

  const lastDiff = (curr?: number, prev?: number) => {
    if (curr == null || prev == null) return null;
    return curr - prev;
  };

  const moodTrend = computeTrend(trendData.map(d => d.mood));
  const stressTrend = computeTrend(trendData.map(d => d.stress));
  const engagementTrend = computeTrend(trendData.map(d => d.engagement));

  const lastMoodDiff = lastDiff(trendData.at(-1)?.mood, trendData.at(-2)?.mood);
  const lastStressDiff = lastDiff(trendData.at(-1)?.stress, trendData.at(-2)?.stress);
  const lastEngagementDiff = lastDiff(trendData.at(-1)?.engagement, trendData.at(-2)?.engagement);

  if (!hasRole('ADMIN')) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-red-800 mb-2">Доступ запрещен</h3>
          <p className="text-red-600">Только ADMIN может просматривать психоэмоциональный анализ.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Эмоциональный анализ групп</h1>
          <p className="text-sm text-gray-600">
            Общая статистика эмоционального состояния учащихся | Последнее обновление: {lastUpdated || '—'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="px-3 py-1.5 rounded-md text-sm border bg-white"
          >
            <option value="all">Все группы</option>
            {groups.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          {periodOptions.map(p => (
            <button
              key={p.value}
              onClick={() => changePeriod(p.value as any)}
              className={`px-3 py-1.5 rounded-md text-sm transition ${
                (filter.period === p.value) ||
                (p.value === 'week' && !filter.period && filter.dateFrom && filter.dateTo)
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border text-gray-700 hover:bg-gray-50'
              }`}
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={refetch}
            className="px-3 py-1.5 rounded-md text-sm bg-gray-100 hover:bg-gray-200 text-gray-700"
            disabled={loadingRefresh}
          >
            {loadingRefresh ? '...' : 'Обновить'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Spinner />
        </div>
      ) : (
        <>
          {/* KPI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <KpiMetricCard title="Всего учащихся" value={totalStudents} isPercent={false} />
            <KpiMetricCard title="Общее настроение" value={globalAverages?.mood} />
            <KpiMetricCard title="Уровень стресса" value={globalAverages?.stress} />
            <KpiMetricCard title="Вовлеченность" value={globalAverages?.engagement} />
          </div>

          {/* Layout: Left chart, Right group stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart */}
            <div className="bg-white rounded-lg shadow-sm border p-5 flex flex-col">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Динамика показателей</h3>
              {trendData.length >= 2 && (
                <div className="flex flex-wrap gap-4 mb-2 text-xs">
                  <TrendBadge label="Настроение" trend={moodTrend} diff={lastMoodDiff} />
                  <TrendBadge label="Стресс" trend={stressTrend} diff={lastStressDiff} />
                  <TrendBadge label="Вовлеченность" trend={engagementTrend} diff={lastEngagementDiff} />
                </div>
              )}
              <div className="h-72">
                {trendData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-500 text-sm">Нет данных</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="gradMood" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradStress" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#dc2626" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradEng" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#9333ea" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#9333ea" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="idx" tickLine={false} axisLine={false} fontSize={12} />
                      <YAxis domain={[0, 100]} tickLine={false} axisLine={false} fontSize={12} />
                      <Tooltip formatter={(v) => (typeof v === 'number' ? v.toFixed(2) : v)} />
                      <Legend />
                      <Area type="monotone" dataKey="mood" stroke="#2563eb" fill="url(#gradMood)" name="Настроение" />
                      <Area type="monotone" dataKey="stress" stroke="#dc2626" fill="url(#gradStress)" name="Стресс" />
                      <Area type="monotone" dataKey="engagement" stroke="#9333ea" fill="url(#gradEng)" name="Вовлеченность" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Group stats cards */}
            <div className="bg-white rounded-lg shadow-sm border p-5 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-700">Статистика по группам</h3>
                <span className="text-xs text-gray-500">{filteredGroupStats.length} групп</span>
              </div>
              <div className="space-y-4 overflow-y-auto pr-1" style={{ maxHeight: '288px' }}>
                {filteredGroupStats.length === 0 && (
                  <div className="text-sm text-gray-500">Нет данных</div>
                )}
                {filteredGroupStats.map(g => (
                  <div key={g.group} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-gray-900">Группа {g.group}</span>
                      </div>
                      <span className="text-sm text-gray-500">{g.students} учащихся</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <MetricBar label="Настроение" value={g.averageMood} />
                      <MetricBar label="Стресс" value={g.averageStress} color="stress" />
                      <MetricBar label="Вовлеченность" value={g.averageEngagement} color="eng" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Events */}
          <div className="bg-white rounded-lg shadow-sm border p-5">
            <h3 className="text-sm font-medium text-gray-700 mb-4">События и их влияние</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-h-[280px] overflow-y-auto">
              {events.map(ev => (
                <div key={ev.date} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-white rounded-lg shadow-sm">
                      <div className="w-4 h-4 text-blue-500 text-[10px] flex items-center justify-center font-semibold">
                        {ev.date.slice(5, 10)}
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{ev.date}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-1">{ev.title}</p>
                  <div className="space-y-1.5 text-xs">
                    <EventMetric label="Настроение" value={ev.mood} />
                    <EventMetric label="Стресс" value={ev.stress} color="stress" />
                    <EventMetric label="Вовлеченность" value={ev.engagement} color="eng" />
                  </div>
                </div>
              ))}
            </div>
          </div>

            {/* Attention Students */}
            <div className="bg-white rounded-lg shadow-sm border p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-700">Ученики, требующие внимания</h3>
                <span className="px-3 py-1 bg-red-50 text-red-600 text-sm font-medium rounded-full">
                  {riskStudents.length} учеников
                </span>
              </div>
              {riskStudents.length === 0 && (
                <div className="text-sm text-gray-500">Нет учащихся с высоким стрессом</div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[600px] overflow-y-auto pr-1">
                {riskStudents.map(st => {
                  const name = `${st.student.user.name} ${st.student.user.surname}`;
                  return (
                    <div key={st.student.id} className="bg-gray-50 rounded-lg p-4 flex flex-col">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-sm font-semibold text-gray-600 border">
                          {st.student.user.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-900">{name}</h4>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">Группа {st.student.group?.name}</p>
                        </div>
                      </div>
                      <div className="mt-4 space-y-3 text-xs">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-gray-500">Уровень стресса</span>
                            <span className="font-medium text-red-600">{st.stress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full bg-red-500" style={{ width: `${st.stress}%` }} />
                          </div>
                        </div>
                        <p className="text-gray-600">{stressMessage(st.stress)}</p>
                        <div className="flex flex-col gap-1 pt-2 border-t border-gray-200">
                          {st.student.user.phone && (
                            <div className="flex items-center gap-2 text-gray-500">
                              <span>{st.student.user.phone}</span>
                            </div>
                          )}
                          <button
                            onClick={() => openStudentDetails(st.student.id)}
                            className="mt-1 inline-flex items-center justify-center px-2 py-1 text-[11px] bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Детали
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
        </>
      )}

      {/* Modal / Drawer for student details (reuse existing logic) */}
      {selectedStudentId !== null && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={closeStudentDetails}
          />
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-800">Студент #{selectedStudentId}</h3>
              <button
                onClick={closeStudentDetails}
                className="text-gray-500 hover:text-gray-800 text-sm"
              >
                Закрыть
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {selectedStudentDetails.loading && (
                <div className="flex items-center justify-center h-40">
                  <Spinner />
                </div>
              )}
              {selectedStudentDetails.error && (
                <div className="bg-red-50 text-red-700 p-3 rounded text-sm">
                  {selectedStudentDetails.error}
                </div>
              )}
              {!selectedStudentDetails.loading && !selectedStudentDetails.error && !selectedStudentDetails.emotional && (
                <div className="text-sm text-gray-500">Нет данных</div>
              )}
              {selectedStudentDetails.emotional && (
                <StudentDetailsContent data={selectedStudentDetails.emotional} />
              )}
            </div>
            <div className="p-3 border-t flex justify-end">
              <button
                onClick={closeStudentDetails}
                className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-sm text-gray-700"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* Components */

const KpiMetricCard: React.FC<{ title: string; value?: number; customValue?: React.ReactNode; isPercent?: boolean }> = ({ title, value, customValue, isPercent = true }) => {
  const invalid = value === undefined || value === null || Number.isNaN(value) || !Number.isFinite(value as number);
  return (
    <div className="bg-white rounded-lg shadow-sm border p-5 flex flex-col">
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">{title}</div>
      {customValue ? customValue : invalid ? (
        <div className="text-sm text-gray-400">—</div>
      ) : (
        <div className={`text-3xl font-semibold ${colorByValue(value!)}`}>{value}{isPercent ? '%' : ''}</div>
      )}
    </div>
  );
};

// Legacy placeholder (not used directly now but kept for consistency if extended)
const KpiCard: React.FC<{ title: string; value: number | string; extraValue?: any; raw?: any; bigValueOverride?: any }> = ({ title, value }) => (
  <div className="hidden" aria-hidden="true">{title}{value}</div>
);

const MetricBar: React.FC<{ label: string; value: number; color?: 'stress' | 'eng' }> = ({ label, value, color }) => {
  const palette = color === 'stress'
    ? 'bg-red-500'
    : color === 'eng'
      ? 'bg-purple-500'
      : 'bg-green-500';
  const invalid = value === null || value === undefined || Number.isNaN(value) || !Number.isFinite(value);
  const shown = invalid ? '—' : `${value}%`;
  const width = invalid ? 0 : value;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-500">{label}</span>
        <span className="text-sm font-medium text-gray-900">{shown}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${palette}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
};

const EventMetric: React.FC<{ label: string; value: number; color?: 'stress' | 'eng' }> = ({ label, value, color }) => {
  const palette = color === 'stress'
    ? 'bg-red-500'
    : color === 'eng'
      ? 'bg-purple-500'
      : 'bg-green-500';
  const invalid = value === null || value === undefined || Number.isNaN(value) || !Number.isFinite(value);
  const shown = invalid ? '—' : `${value}%`;
  const width = invalid ? 0 : value;
  return (
    <div>
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-gray-500">{label}</span>
        <span className="font-medium text-gray-900">{shown}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1">
        <div className={`${palette} h-1 rounded-full`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
};
 
const TrendBadge: React.FC<{label:string;trend:string;diff:number|null}> = ({label, trend, diff}) => {
  const color = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600';
  const arrow = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
  return (
    <div className="flex items-center gap-1 px-2 py-1 rounded bg-gray-100">
      <span className="font-medium">{label}</span>
      <span className={`${color} font-semibold`}>{arrow}{diff != null ? Math.round(diff) : ''}</span>
    </div>
  );
};
 
const StudentDetailsContent: React.FC<{ data: any }> = ({ data }) => {
  const metricLabel: Record<string,string> = {
    mood: 'Настроение',
    concentration: 'Концентрация',
    socialization: 'Социализация',
    motivation: 'Мотивация'
  };
  const detail = data;
  return (
    <div className="space-y-6">
      {detail.currentState ? (
        <div className="grid grid-cols-2 gap-4">
          {['mood','concentration','socialization','motivation'].map(k => {
            const item = (detail.currentState as any)[k];
            if (!item) return null;
            return (
              <div key={k} className="bg-gray-50 rounded p-3">
                <div className="text-xs font-medium text-gray-500 uppercase">{metricLabel[k] || k}</div>
                <div className={`text-xl font-semibold ${colorByValue(item.value)}`}>{item.value}</div>
                <div className="text-xs text-gray-500">{item.description}</div>
                <div className="text-[10px] mt-1 text-gray-400">Тренд: {item.trend}</div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-sm text-gray-500">Нет текущего состояния</div>
      )}

      {detail.feedbackHistory && detail.feedbackHistory.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">История</h4>
          <div className="max-h-60 overflow-auto rounded border divide-y text-xs">
            {detail.feedbackHistory.slice(0,50).map((h: any, idx: number) => (
              <div key={idx} className="px-3 py-2 flex flex-col gap-1">
                <div className="flex justify-between text-gray-600">
                  <span>{h.date?.slice(0,10)}</span>
                  <span className="text-[10px]">{h.template}</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(h.metrics || {}).map(([mk, mv]) => (
                    <span
                      key={mk}
                      className={`px-1.5 py-0.5 rounded bg-gray-100 ${colorByValue(Number(mv))} text-[10px] font-medium`}
                    >
                      {mk}:{mv as any}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {detail.recommendations && detail.recommendations.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Рекомендации</h4>
          <ul className="space-y-2">
            {detail.recommendations.map((r: any, i: number) => (
              <li
                key={i}
                className={`text-xs p-2 rounded border ${
                  r.priority === 'high'
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : r.priority === 'medium'
                    ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
                    : 'bg-gray-50 border-gray-200 text-gray-600'
                }`}
              >
                {r.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default EmotionalAnalysisPage;
