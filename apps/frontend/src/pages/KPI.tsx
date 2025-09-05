import React, { useState, useEffect } from 'react';
import { FaChartLine, FaSearch, FaArrowUp, FaArrowDown, FaMinus, FaFileExport, FaTimes } from 'react-icons/fa';
import { kpiService } from '../services/kpiService';
import { feedbackService, type FeedbackStatistics } from '../services/feedbackService';
import type {
  KpiOverviewResponse,
  TeacherKpiResponse,
  KpiFilter,
  TeacherKpi,
} from '../types/kpi';
import { Spinner } from '../components/ui/Spinner';
import KpiAchievementModal from '../components/KpiAchievementModal';
import KpiAchievementsList from '../components/KpiAchievementsList';
import PeriodicKpiDashboard from '../components/PeriodicKpiDashboard';
import { HelpTooltip } from '../components/ui';

const KPI: React.FC = () => {
  const [overview, setOverview] = useState<KpiOverviewResponse | null>(null);
  const [teachers, setTeachers] = useState<TeacherKpiResponse | null>(null);
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'main' | 'periodic'>('main');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherKpi | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isAchievementModalOpen, setIsAchievementModalOpen] = useState(false);
  const [isAchievementsListOpen, setIsAchievementsListOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const filter: KpiFilter = {};

      const [overviewData, teachersData, feedbackStatsData] = await Promise.all([
        kpiService.getOverview(filter),
        kpiService.getTeacherKpi(filter),
        feedbackService.getStatistics()
      ]);

      setOverview(overviewData);
      setTeachers(teachersData);
      setFeedbackStats(feedbackStatsData);
    } catch (e) {
      setError('Ошибка при загрузке данных');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await kpiService.exportKpi({}, 'xlsx');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kpi-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Экспорт не удался', e);
      alert('Ошибка экспорта');
    }
  };

  const filteredTeachers =
    teachers?.teachers.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase())) || [];

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <FaArrowUp className="text-green-500" />;
    if (trend < 0) return <FaArrowDown className="text-red-500" />;
    return <FaMinus className="text-gray-400" />;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800';
    if (score >= 75) return 'bg-blue-100 text-blue-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const formatMetricValue = (value: number): string => {
    if (value === -1) return '—';
    return `${value}%`;
  };

  const openTeacher = (teacher: TeacherKpi) => {
    setSelectedTeacher(teacher);
    setIsModalOpen(true);
  };

  const metricPairs: Array<{ key: keyof TeacherKpi; label: string }> = [
    { key: 'teachingQuality', label: 'Контрольные' },
    { key: 'classAttendance', label: 'Журнал' },
    { key: 'workloadCompliance', label: 'КТП' },
    { key: 'professionalDevelopment', label: 'Материалы' },
    { key: 'studentSatisfaction', label: 'Активность' },
    { key: 'parentFeedback', label: 'Родители' },
  ];

  const metricInfo: Record<string, string> = {
    teachingQuality: 'Качество преподавания: выполнение контрольных, результаты учеников и полнота оценивания.',
    classAttendance: 'Заполнение и ведение журнала: своевременность и полнота отметок посещаемости и оценок.',
    workloadCompliance: 'Соответствие КТП: актуальность тематического и календарного планирования, соблюдение плана.',
    professionalDevelopment: 'Материалы и развитие: загрузка учебных материалов, участие в развитии контента.',
    studentSatisfaction: 'Удержание / удовлетворенность студентов: агрегированная метрика на основе регулярного фидбека и посещаемости.',
    parentFeedback: 'Обратная связь родителей: усреднённая оценка вовлечённости и удовлетворенности по формулам KPI.'
  };

  // Открытие модалок достижений поверх teacher modal
  const openAchievementModal = () => {
    if (selectedTeacher) {
      setIsAchievementModalOpen(true);
      setIsModalOpen(false);
    }
  };

  const openAchievementsHistory = () => {
    if (selectedTeacher) {
      setIsAchievementsListOpen(true);
      setIsModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-800 text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">KPI (HR)</h1>
          <p className="text-xs text-gray-500 mt-1">Упрощённый обзор показателей преподавателей</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadData}
            className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm"
          >
            <FaChartLine className="mr-2" />Обновить
          </button>
            <button
              onClick={handleExport}
              className="inline-flex items-center px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md text-sm"
            >
            <FaFileExport className="mr-2" />Экспорт
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 border-b border-gray-200 flex gap-4 text-sm">
        <button
          className={`pb-2 -mb-px border-b-2 ${activeTab === 'main' ? 'border-blue-500 text-blue-600 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('main')}
        >
          Основные
        </button>
        <button
          className={`pb-2 -mb-px border-b-2 ${activeTab === 'periodic' ? 'border-blue-500 text-blue-600 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('periodic')}
        >
          Периодические
        </button>
      </div>

      {activeTab === 'periodic' ? (
        <PeriodicKpiDashboard />
      ) : (
        <>
          {/* Compact Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <StatCard title="Преподавателей" value={teachers?.teachers.length || 0} />
            <StatCard title="Топ (90+)" value={teachers?.statistics.topPerformers || 0} variant="green" />
            <StatCard title="Нужн. улучш." value={teachers?.statistics.needsImprovement || 0} variant="red" />
            <StatCard title="Фидбеков" value={feedbackStats?.totalResponses ?? 0} variant="indigo" />
          </div>

          {/* Search */}
          <div className="mb-4">
            <div className="relative max-w-md">
              <input
                type="text"
                placeholder="Поиск преподавателя..."
                className="pl-9 pr-3 py-2 border border-gray-300 rounded-md w-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FaSearch className="absolute left-3 top-2.5 text-gray-400" />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
              <h2 className="font-medium text-sm text-gray-800">Преподаватели</h2>
              <span className="text-xs text-gray-500">{filteredTeachers.length} записей</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">#</th>
                    <th className="px-3 py-2 text-left font-medium">Имя</th>
                    <th className="px-3 py-2 text-left font-medium">KPI</th>
                    {metricPairs.map(m => (
                      <th key={m.key as string} className="px-3 py-2 text-left font-medium">
                        <div className="flex items-center gap-1">
                          <span>{m.label}</span>
                          <HelpTooltip text={metricInfo[m.key] || ''} />
                        </div>
                      </th>
                    ))}
                    <th className="px-3 py-2 text-left font-medium">Δ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTeachers.map(t => (
                    <tr
                      key={t.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => openTeacher(t)}
                    >
                      <td className="px-3 py-2 text-gray-700">{t.rank}</td>
                      <td className="px-3 py-2 font-medium text-gray-800 max-w-[150px] truncate">{t.name}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${getScoreColor(t.overallScore)}`}>
                          {t.overallScore}
                        </span>
                      </td>
                      {metricPairs.map(m => (
                        <td key={m.key as string} className="px-3 py-2 text-gray-700">
                          {formatMetricValue(t[m.key] as number)}
                        </td>
                      ))}
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1 text-xs">
                          {getTrendIcon(t.trend)}
                          <span className="text-gray-600">{Math.abs(t.trend)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredTeachers.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-4 py-6 text-center text-sm text-gray-500">
                        Нет данных
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Achievement modals */}
          {selectedTeacher && (
            <KpiAchievementModal
              isOpen={isAchievementModalOpen}
              onClose={() => { setIsAchievementModalOpen(false); setIsModalOpen(true); }}
              teacherId={selectedTeacher.id}
              teacherName={selectedTeacher.name}
              onSuccess={loadData}
            />
          )}

          {selectedTeacher && (
            <KpiAchievementsList
              isOpen={isAchievementsListOpen}
              onClose={() => { setIsAchievementsListOpen(false); setIsModalOpen(true); }}
              teacherId={selectedTeacher.id}
              teacherName={selectedTeacher.name}
            />
          )}
        </>
      )}

      {/* Teacher modal */}
      {isModalOpen && selectedTeacher && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-2xl border border-gray-200">
            <div className="flex items-start justify-between p-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{selectedTeacher.name}</h2>
                <p className="text-xs text-gray-500 mt-1">Детализация показателей</p>
              </div>
              <button
                className="text-gray-400 hover:text-gray-600"
                onClick={() => setIsModalOpen(false)}
              >
                <FaTimes />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Overall */}
              <div className="flex items-center gap-3">
                <div className={`w-16 h-16 rounded-md flex items-center justify-center text-xl font-bold ${getScoreColor(selectedTeacher.overallScore)}`}>
                  {selectedTeacher.overallScore}
                </div>
                <div className="text-sm text-gray-600">
                  Общий KPI. Основан на текущей периодической агрегации.
                </div>
              </div>

              {/* Metrics grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {metricPairs.map(m => {
                  const val = selectedTeacher[m.key] as number;
                  return (
                    <div key={m.key as string} className="border border-gray-200 rounded-md p-2">
                      <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                        <span>{m.label}</span>
                        <HelpTooltip text={metricInfo[m.key] || ''} />
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-semibold text-gray-800">
                          {val === -1 ? '—' : `${val}%`}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded mt-2">
                        <div
                          className="h-2 bg-blue-500 rounded"
                          style={{ width: `${val >= 0 ? val : 0}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                <button
                  onClick={openAchievementModal}
                  className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-xs"
                >
                  + Достижение
                </button>
                <button
                  onClick={openAchievementsHistory}
                  className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs"
                >
                  История достижений
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="ml-auto px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded text-xs"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: number | string; variant?: 'green' | 'red' | 'indigo' }> = ({ title, value, variant }) => {
  const color =
    variant === 'green'
      ? 'bg-green-50 border-green-200 text-green-700'
      : variant === 'red'
      ? 'bg-red-50 border-red-200 text-red-700'
      : variant === 'indigo'
      ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
      : 'bg-gray-50 border-gray-200 text-gray-700';
  return (
    <div className={`rounded-md border p-3 flex flex-col ${color}`}>
      <span className="text-xs uppercase tracking-wide font-medium">{title}</span>
      <span className="mt-1 text-lg font-semibold leading-none">{value}</span>
    </div>
  );
};

export default KPI;
