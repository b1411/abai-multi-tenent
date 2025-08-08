import React, { useState, useEffect } from 'react';
import {
  FaChartLine,
  FaSearch,
  FaFileExport,
  FaArrowUp,
  FaArrowDown,
  FaMinus,
} from 'react-icons/fa';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { kpiService } from '../services/kpiService';
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

const KPI: React.FC = () => {
  const [overview, setOverview] = useState<KpiOverviewResponse | null>(null);
  const [teachers, setTeachers] = useState<TeacherKpiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'main' | 'periodic'>('main');

  const [selectedTeacher, setSelectedTeacher] = useState<TeacherKpi | null>(null);
  const [selectedTeacherDetails, setSelectedTeacherDetails] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Состояния для формы добавления достижений
  const [isAchievementModalOpen, setIsAchievementModalOpen] = useState(false);
  const [achievementType, setAchievementType] = useState<string>('');
  const [formData, setFormData] = useState<any>({});
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Новые состояния для списка достижений
  const [isAchievementsListOpen, setIsAchievementsListOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const filter: KpiFilter = {};

      const [overviewData, teachersData] = await Promise.all([
        kpiService.getOverview(filter),
        kpiService.getTeacherKpi(filter),
      ]);

      setOverview(overviewData);
      setTeachers(teachersData);
    } catch (err) {
      setError('Ошибка при загрузке данных KPI');
      console.error('Error loading KPI data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <FaArrowUp className="text-green-500" />;
    if (trend < 0) return <FaArrowDown className="text-red-500" />;
    return <FaMinus className="text-gray-500" />;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800';
    if (score >= 75) return 'bg-blue-100 text-blue-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const filteredTeachers = teachers?.teachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const formatMetricValue = (value: number): string => {
    if (value === -1) return 'В разработке';
    return `${value}%`;
  };

  const prepareCategoryRadarData = (teacher: TeacherKpi) => {
    return [
      { category: 'Контрольные работы', score: teacher.teachingQuality === -1 ? 0 : teacher.teachingQuality },
      { category: 'Заполнение журнала', score: teacher.classAttendance === -1 ? 0 : teacher.classAttendance },
      { category: 'Выполнение КТП', score: teacher.workloadCompliance === -1 ? 0 : teacher.workloadCompliance },
      { category: 'Материалы к урокам', score: teacher.professionalDevelopment === -1 ? 0 : teacher.professionalDevelopment },
      { category: 'Активность учеников', score: teacher.studentSatisfaction === -1 ? 0 : teacher.studentSatisfaction },
    ];
  };

  const handleTeacherClick = async (teacher: TeacherKpi) => {
    setSelectedTeacher(teacher);
    setIsModalOpen(true);
    setModalLoading(true);
    setSelectedTeacherDetails(null);

    try {
      // Запрашиваем детальную информацию о преподавателе
      const details = await kpiService.getTeacherKpiDetails(teacher.id);
      setSelectedTeacherDetails(details);
    } catch (error) {
      console.error('Ошибка при загрузке детальной информации:', error);
      // Если нет метода getTeacherKpiDetails, используем базовые данные
      setSelectedTeacherDetails({
        teacher: {
          id: teacher.id,
          name: teacher.name,
          email: 'Не указан',
        },
        metrics: {
          teachingQuality: {
            value: teacher.teachingQuality,
            weight: 25,
            isActive: true,
          },
          classAttendance: {
            value: teacher.classAttendance,
            weight: 25,
            isActive: true,
          },
          workloadCompliance: {
            value: teacher.workloadCompliance,
            weight: 25,
            isActive: true,
          },
          professionalDevelopment: {
            value: teacher.professionalDevelopment,
            weight: 15,
            isActive: true,
          },
          studentSatisfaction: {
            value: teacher.studentSatisfaction,
            weight: 10,
            isActive: true,
          },
        },
        overallScore: teacher.overallScore,
        lastCalculated: new Date(),
        rawData: {
          subjectsCount: 0,
          schedulesCount: 0,
          totalWorkloadHours: 0,
          actualWorkloadHours: 0,
        },
      });
    } finally {
      setModalLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const filter: KpiFilter = {};
      const blob = await kpiService.exportKpi(filter, 'xlsx');
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `kpi-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Ошибка при экспорте KPI:', error);
      alert('Произошла ошибка при экспорте данных');
    }
  };

  const handleAddAchievement = () => {
    setIsAchievementModalOpen(true);
  };

  const handleAchievementSuccess = () => {
    loadData(); // Перезагружаем данные после успешного добавления
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
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto">
      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">KPI Преподавателей</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Система оценки эффективности</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <button 
            className="flex items-center justify-center px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base min-h-[44px]"
            onClick={loadData}
            disabled={loading}
          >
            <FaChartLine className="mr-2" />
            Обновить
          </button>
          <button 
            className="flex items-center justify-center px-3 sm:px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm sm:text-base min-h-[44px]"
            onClick={handleExport}
          >
            <FaFileExport className="mr-2" />
            Экспорт
          </button>
        </div>
      </div>

      {/* Вкладки */}
      <div className="mb-6 sm:mb-8">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('main')}
            className={`px-4 sm:px-6 py-3 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap min-h-[44px] ${
              activeTab === 'main'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Основные KPI
          </button>
          <button
            onClick={() => setActiveTab('periodic')}
            className={`px-4 sm:px-6 py-3 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap min-h-[44px] ${
              activeTab === 'periodic'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Периодические KPI
          </button>
        </div>
      </div>

      {/* Контент вкладок */}
      {activeTab === 'periodic' ? (
        <PeriodicKpiDashboard />
      ) : (
        <div>
          {/* Информация о системе */}
      <div className="mb-6 sm:mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6 rounded-lg shadow-sm border border-blue-200">
        <div className="flex items-start space-x-3 sm:space-x-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <FaChartLine className="text-white text-lg sm:text-xl" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-2">
              🚀 Новая система расчета KPI удержания учеников
            </h3>
            <div className="text-xs sm:text-sm text-blue-800 space-y-2">
              <p>
                <strong>Новый подход:</strong> Система анализирует только фидбеки студентов с KPI-метками 
                для максимальной объективности и точности расчета удержания.
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mt-3">
                <div className="bg-white p-3 rounded border border-blue-200">
                  <div className="font-medium text-blue-900 mb-1 text-xs sm:text-sm">📊 Источник данных:</div>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Фидбеки студентов с KPI-вопросами</li>
                    <li>• Анализ уверенности данных (≥30%)</li>
                    <li>• Конвертация ответов в баллы 0-100</li>
                  </ul>
                </div>
                <div className="bg-white p-3 rounded border border-blue-200">
                  <div className="font-medium text-blue-900 mb-1 text-xs sm:text-sm">⚡ Алгоритм работы:</div>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Поиск релевантных фидбеков</li>
                    <li>• Применение весов вопросов</li>
                    <li>• Расчет итогового балла KPI</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Поиск */}
      <div className="mb-6 sm:mb-8 bg-white p-4 rounded-lg shadow-sm">
        <div className="relative max-w-full sm:max-w-md">
          <input
            type="text"
            placeholder="Поиск преподавателя..."
            className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base min-h-[44px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FaSearch className="absolute left-3 top-3.5 text-gray-400" />
        </div>
      </div>

      {/* Два графика */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* График 1: Распределение по уровням KPI */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold mb-4">Распределение по уровням KPI</h3>
          <div className="h-[250px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Отлично (90+)', value: teachers?.statistics.topPerformers || 0, fill: '#10B981' },
                    { name: 'Хорошо (75-89)', value: teachers?.statistics.onTrack || 0, fill: '#3B82F6' },
                    { name: 'Удовлетворительно (60-74)', value: Math.max(0, (teachers?.teachers.length || 0) - (teachers?.statistics.topPerformers || 0) - (teachers?.statistics.onTrack || 0) - (teachers?.statistics.needsImprovement || 0)), fill: '#F59E0B' },
                    { name: 'Требует улучшения (<60)', value: teachers?.statistics.needsImprovement || 0, fill: '#EF4444' }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#10B981" />
                  <Cell fill="#3B82F6" />
                  <Cell fill="#F59E0B" />
                  <Cell fill="#EF4444" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded mr-2 flex-shrink-0"></div>
              <span className="truncate">Отлично: {teachers?.statistics.topPerformers || 0}</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded mr-2 flex-shrink-0"></div>
              <span className="truncate">Хорошо: {teachers?.statistics.onTrack || 0}</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded mr-2 flex-shrink-0"></div>
              <span className="truncate">Удовлетворительно: {Math.max(0, (teachers?.teachers.length || 0) - (teachers?.statistics.topPerformers || 0) - (teachers?.statistics.onTrack || 0) - (teachers?.statistics.needsImprovement || 0))}</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded mr-2 flex-shrink-0"></div>
              <span className="truncate">Требует улучшения: {teachers?.statistics.needsImprovement || 0}</span>
            </div>
          </div>
        </div>

        {/* График 2: Средние показатели по метрикам */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold mb-4">Средние показатели по метрикам</h3>
          <div className="h-[250px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { 
                    metric: 'Контрольные работы', 
                    value: teachers?.teachers && teachers.teachers.length > 0 
                      ? Math.round(teachers.teachers.reduce((sum, t) => sum + (t.teachingQuality >= 0 ? t.teachingQuality : 0), 0) / teachers.teachers.length)
                      : 0,
                    weight: '25%'
                  },
                  { 
                    metric: 'Заполнение журнала', 
                    value: teachers?.teachers && teachers.teachers.length > 0 
                      ? Math.round(teachers.teachers.reduce((sum, t) => sum + (t.classAttendance >= 0 ? t.classAttendance : 0), 0) / teachers.teachers.length)
                      : 0,
                    weight: '25%'
                  },
                  { 
                    metric: 'Выполнение КТП', 
                    value: teachers?.teachers && teachers.teachers.length > 0 
                      ? Math.round(teachers.teachers.reduce((sum, t) => sum + (t.workloadCompliance >= 0 ? t.workloadCompliance : 0), 0) / teachers.teachers.length)
                      : 0,
                    weight: '25%'
                  },
                  { 
                    metric: 'Материалы к урокам', 
                    value: teachers?.teachers && teachers.teachers.length > 0 
                      ? Math.round(teachers.teachers.reduce((sum, t) => sum + (t.professionalDevelopment >= 0 ? t.professionalDevelopment : 0), 0) / teachers.teachers.length)
                      : 0,
                    weight: '15%'
                  },
                  { 
                    metric: 'Активность учеников', 
                    value: teachers?.teachers && teachers.teachers.length > 0 
                      ? Math.round(teachers.teachers.reduce((sum, t) => sum + (t.studentSatisfaction >= 0 ? t.studentSatisfaction : 0), 0) / teachers.teachers.length)
                      : 0,
                    weight: '10%'
                  }
                ]}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="metric" 
                  angle={-45} 
                  textAnchor="end" 
                  height={80} 
                  fontSize={12}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  formatter={(value, name) => [`${value}%`, 'Среднее значение']}
                  labelFormatter={(label) => `Метрика: ${label}`}
                />
                <Bar 
                  dataKey="value" 
                  fill="#3B82F6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Таблица преподавателей */}
      {teachers && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
              <h3 className="text-base sm:text-lg font-semibold">Рейтинг преподавателей</h3>
              <div className="text-xs sm:text-sm text-gray-500">
                Всего: {filteredTeachers.length} преподавателей
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Рейтинг
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
                    Преподаватель
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Общий KPI
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Контрольные (25%)
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Журнал (25%)
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    КТП (25%)
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Материалы (15%)
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Активность (10%)
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Тренд
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTeachers.map((teacher) => (
                  <tr
                    key={teacher.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors active:bg-gray-100"
                    onClick={() => handleTeacherClick(teacher)}
                  >
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                      #{teacher.rank}
                    </td>
                    <td className="px-3 sm:px-6 py-4">
                      <div className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none">{teacher.name}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getScoreColor(teacher.overallScore)}`}>
                        {teacher.overallScore}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      {formatMetricValue(teacher.teachingQuality)}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      {formatMetricValue(teacher.classAttendance)}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      {formatMetricValue(teacher.workloadCompliance)}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      {formatMetricValue(teacher.professionalDevelopment)}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      {formatMetricValue(teacher.studentSatisfaction)}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getTrendIcon(teacher.trend)}
                        <span className="ml-1 text-xs sm:text-sm">{Math.abs(teacher.trend)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Модальное окно детальной информации */}
      {isModalOpen && selectedTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start mb-4 sm:mb-6 space-y-4 sm:space-y-0">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">{selectedTeacher.name}</h2>
                  <p className="text-sm sm:text-base text-gray-600">Детальная информация о KPI</p>
                </div>
                <div className="flex items-center space-x-3 sm:space-x-4 flex-shrink-0">
                  <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center ${getScoreColor(selectedTeacher.overallScore)}`}>
                    <span className="font-bold text-lg sm:text-xl lg:text-2xl">{selectedTeacher.overallScore}</span>
                  </div>
                  <button
                    className="text-gray-500 hover:text-gray-700 text-xl sm:text-2xl min-w-[44px] min-h-[44px] flex items-center justify-center"
                    onClick={() => setIsModalOpen(false)}
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Радар-график */}
                <div className="bg-gray-50 rounded-lg p-4 order-2 lg:order-1">
                  <h3 className="text-base sm:text-lg font-semibold mb-4 text-center">Профиль KPI</h3>
                  <div className="h-[250px] sm:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={prepareCategoryRadarData(selectedTeacher)}>
                        <PolarGrid stroke="#E5E7EB" />
                        <PolarAngleAxis
                          dataKey="category"
                          tick={{ fill: '#6B7280', fontSize: 11 }}
                          stroke="#E5E7EB"
                        />
                        <PolarRadiusAxis
                          angle={30}
                          domain={[0, 100]}
                          tick={{ fill: '#6B7280', fontSize: 10 }}
                          stroke="#E5E7EB"
                        />
                        <Radar
                          name="Показатели"
                          dataKey="score"
                          stroke="#3B82F6"
                          fill="#3B82F6"
                          fillOpacity={0.2}
                          strokeWidth={2}
                        />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Детальные показатели */}
                <div className="space-y-3 order-1 lg:order-2">
                  {/* Основные метрики с весами */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Основные метрики (с весами)</h4>
                    
                    <div className="space-y-4">
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <h4 className="text-lg font-bold text-gray-800 mb-4">Основные показатели KPI</h4>
                        <div className="text-sm text-gray-600 mb-4">
                          Каждый показатель имеет два значения: <strong>вес в KPI</strong> (важность) и <strong>фактическое значение</strong> (результат)
                        </div>
                        
                        <div className="space-y-3">
                          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                            <div className="flex justify-between items-center mb-2">
                              <div>
                                <span className="text-sm font-medium text-green-800">Прогресс по контрольным работам</span>
                                <div className="text-xs text-green-600">Вес в KPI: 20%</div>
                              </div>
                              <div className="text-right">
                                <span className="text-lg font-bold text-green-700">{formatMetricValue(selectedTeacher.teachingQuality)}</span>
                                <div className="text-xs text-green-600">фактический результат</div>
                              </div>
                            </div>
                            <div className="w-full bg-green-200 rounded-full h-2 mb-2">
                              <div
                                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${selectedTeacher.teachingQuality === -1 ? 0 : selectedTeacher.teachingQuality}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-green-600">Процент оценок ≥4 из контрольных работ</div>
                          </div>

                          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                            <div className="flex justify-between items-center mb-2">
                              <div>
                                <span className="text-sm font-medium text-blue-800">Заполнение журнала</span>
                                <div className="text-xs text-blue-600">Вес в KPI: 15%</div>
                              </div>
                              <div className="text-right">
                                <span className="text-lg font-bold text-blue-700">{formatMetricValue(selectedTeacher.classAttendance)}</span>
                                <div className="text-xs text-blue-600">фактический результат</div>
                              </div>
                            </div>
                            <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${selectedTeacher.classAttendance === -1 ? 0 : selectedTeacher.classAttendance}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-blue-600">Процент уроков с оценками и посещаемостью</div>
                          </div>

                          <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                            <div className="flex justify-between items-center mb-2">
                              <div>
                                <span className="text-sm font-medium text-purple-800">Заполнение плана работ (КТП)</span>
                                <div className="text-xs text-purple-600">Вес в KPI: 15%</div>
                              </div>
                              <div className="text-right">
                                <span className="text-lg font-bold text-purple-700">{formatMetricValue(selectedTeacher.workloadCompliance)}</span>
                                <div className="text-xs text-purple-600">фактический результат</div>
                              </div>
                            </div>
                            <div className="w-full bg-purple-200 rounded-full h-2 mb-2">
                              <div
                                className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${selectedTeacher.workloadCompliance === -1 ? 0 : selectedTeacher.workloadCompliance}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-purple-600">Процент выполнения календарно-тематического планирования</div>
                          </div>

                          <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                            <div className="flex justify-between items-center mb-2">
                              <div>
                                <span className="text-sm font-medium text-orange-800">Дополнительные материалы</span>
                                <div className="text-xs text-orange-600">Вес в KPI: 15%</div>
                              </div>
                              <div className="text-right">
                                <span className="text-lg font-bold text-orange-700">{formatMetricValue(selectedTeacher.professionalDevelopment)}</span>
                                <div className="text-xs text-orange-600">фактический результат</div>
                              </div>
                            </div>
                            <div className="w-full bg-orange-200 rounded-full h-2 mb-2">
                              <div
                                className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${selectedTeacher.professionalDevelopment === -1 ? 0 : selectedTeacher.professionalDevelopment}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-orange-600">Процент уроков с прикрепленными материалами</div>
                          </div>

                          <div className="bg-teal-50 rounded-lg p-3 border border-teal-200">
                            <div className="flex justify-between items-center mb-2">
                              <div>
                                <span className="text-sm font-medium text-teal-800">Удержание учеников</span>
                                <div className="text-xs text-teal-600">Вес в KPI: 10%</div>
                              </div>
                              <div className="text-right">
                                <span className="text-lg font-bold text-teal-700">{formatMetricValue(selectedTeacher.studentSatisfaction)}</span>
                                <div className="text-xs text-teal-600">фактический результат</div>
                              </div>
                            </div>
                            <div className="w-full bg-teal-200 rounded-full h-2 mb-2">
                              <div
                                className="bg-teal-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${selectedTeacher.studentSatisfaction === -1 ? 0 : selectedTeacher.studentSatisfaction}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-teal-600">
                              <div className="mb-1">
                                📊 <strong>Основано на фидбеках:</strong>
                              </div>
                              <div className="space-y-1">
                                <div>• Анализ фидбеков студентов с KPI-метками</div>
                                <div>• Порог уверенности ≥30% для использования</div>
                                <div>• Конвертация ответов в баллы 0-100</div>
                              </div>
                            </div>
                            <div className="mt-2 p-2 bg-teal-100 rounded text-xs text-teal-700">
                              <div className="font-medium mb-1">Как это работает:</div>
                              <div className="space-y-1">
                                <div>1. Система находит релевантные фидбеки студентов преподавателя</div>
                                <div>2. Фильтрует вопросы с KPI-меткой "удержание учеников"</div>
                                <div>3. При достаточном количестве ответов рассчитывает балл</div>
                                <div>4. При недостатке данных показывает 0 (нет данных)</div>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Метрики в разработке:</h5>
                            <div className="space-y-1 text-xs text-gray-600">
                              <div>• Обратная связь родителю (15%) - время ответа на сообщения</div>
                              <div>• Отзывы от родителей (10%) - средняя оценка от родителей</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Бонусные метрики */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Бонусные метрики (ручное заполнение)</h4>
                    <div className="space-y-3">
                      <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                        <div className="flex justify-between items-center mb-2">
                          <div className="font-medium text-yellow-800">Призовые места на олимпиадах</div>
                          <div className="flex space-x-1">
                            <button 
                              className="text-xs bg-yellow-600 text-white px-2 py-1 rounded hover:bg-yellow-700 transition-colors"
                              onClick={handleAddAchievement}
                            >
                              + Добавить
                            </button>
                            <button 
                              className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
                              onClick={() => setIsAchievementsListOpen(true)}
                            >
                              ✏️ Редактировать
                            </button>
                          </div>
                        </div>
                        <div className="text-xs text-yellow-600">Международные, республиканские, городские олимпиады</div>
                      </div>

                      <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                        <div className="flex justify-between items-center mb-2">
                          <div className="font-medium text-yellow-800">Поступление в РФМШ/НИШ/БИЛ</div>
                          <button 
                            className="text-xs bg-yellow-600 text-white px-2 py-1 rounded hover:bg-yellow-700 transition-colors"
                            onClick={handleAddAchievement}
                          >
                            + Добавить
                          </button>
                        </div>
                        <div className="text-xs text-yellow-600">Поступление учеников в престижные школы</div>
                      </div>

                      <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                        <div className="flex justify-between items-center mb-2">
                          <div className="font-medium text-yellow-800">Поступление в лицеи/частные школы</div>
                          <button 
                            className="text-xs bg-yellow-600 text-white px-2 py-1 rounded hover:bg-yellow-700 transition-colors"
                            onClick={handleAddAchievement}
                          >
                            + Добавить
                          </button>
                        </div>
                        <div className="text-xs text-yellow-600">Поступление в лицеи и частные школы</div>
                      </div>

                      <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                        <div className="flex justify-between items-center mb-2">
                          <div className="font-medium text-yellow-800">Повышение квалификации</div>
                          <button 
                            className="text-xs bg-yellow-600 text-white px-2 py-1 rounded hover:bg-yellow-700 transition-colors"
                            onClick={handleAddAchievement}
                          >
                            + Добавить
                          </button>
                        </div>
                        <div className="text-xs text-yellow-600">Курсы, сертификаты, обучение</div>
                      </div>

                      <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                        <div className="flex justify-between items-center mb-2">
                          <div className="font-medium text-yellow-800">Участие в командных мероприятиях</div>
                          <button 
                            className="text-xs bg-yellow-600 text-white px-2 py-1 rounded hover:bg-yellow-700 transition-colors"
                            onClick={handleAddAchievement}
                          >
                            + Добавить
                          </button>
                        </div>
                        <div className="text-xs text-yellow-600">Семинары, конференции, корпоративные мероприятия</div>
                      </div>

                      <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                        <div className="flex justify-between items-center mb-2">
                          <div className="font-medium text-yellow-800">Помощь в проектах</div>
                          <button 
                            className="text-xs bg-yellow-600 text-white px-2 py-1 rounded hover:bg-yellow-700 transition-colors"
                            onClick={handleAddAchievement}
                          >
                            + Добавить
                          </button>
                        </div>
                        <div className="text-xs text-yellow-600">Участие в школьных и образовательных проектах</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 sm:pt-6 border-t mt-4 sm:mt-6 space-x-3">
                <button 
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm sm:text-base min-h-[44px] min-w-[80px]"
                  onClick={() => setIsModalOpen(false)}
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно для добавления достижений */}
      {selectedTeacher && (
        <KpiAchievementModal
          isOpen={isAchievementModalOpen}
          onClose={() => setIsAchievementModalOpen(false)}
          teacherId={selectedTeacher.id}
          teacherName={selectedTeacher.name}
          onSuccess={handleAchievementSuccess}
        />
      )}

      {/* Модальное окно для редактирования достижений */}
      {selectedTeacher && (
        <KpiAchievementsList
          isOpen={isAchievementsListOpen}
          onClose={() => setIsAchievementsListOpen(false)}
          teacherId={selectedTeacher.id}
          teacherName={selectedTeacher.name}
        />
      )}
        </div>
      )}
    </div>
  );
};

export default KPI;
