import React, { useState, useEffect } from 'react';
import {
  FaChartLine,
  FaFilter,
  FaSearch,
  FaFileExport,
  FaArrowUp,
  FaArrowDown,
  FaMinus,
  FaRegClock,
  FaCog,
} from 'react-icons/fa';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { kpiService } from '../services/kpiService';
import type {
  KpiOverviewResponse,
  TeacherKpiResponse,
  DepartmentKpiResponse,
  KpiTrendsResponse,
  KpiGoalsResponse,
  KpiFilter,
  TeacherKpi,
  KpiRecalculationResponse,
} from '../types/kpi';
import { Spinner } from '../components/ui/Spinner';
import KpiSettingsModal from '../components/KpiSettingsModal';

const KPI: React.FC = () => {
  const [overview, setOverview] = useState<KpiOverviewResponse | null>(null);
  const [teachers, setTeachers] = useState<TeacherKpiResponse | null>(null);
  const [departments, setDepartments] = useState<DepartmentKpiResponse | null>(null);
  const [trends, setTrends] = useState<KpiTrendsResponse | null>(null);
  const [goals, setGoals] = useState<KpiGoalsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedTeacher, setSelectedTeacher] = useState<TeacherKpi | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [periodFilter, setPeriodFilter] = useState('month');

  useEffect(() => {
    loadData();
  }, [selectedDepartment, periodFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const filter: KpiFilter = {
        department: selectedDepartment || undefined,
        period: periodFilter,
      };

      const [overviewData, teachersData, departmentsData, trendsData, goalsData] = await Promise.all([
        kpiService.getOverview(filter),
        kpiService.getTeacherKpi(filter),
        kpiService.getDepartmentKpi(filter),
        kpiService.getTrends(filter),
        kpiService.getGoals(filter),
      ]);

      setOverview(overviewData);
      setTeachers(teachersData);
      setDepartments(departmentsData);
      setTrends(trendsData);
      setGoals(goalsData);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'danger':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'bg-green-100 text-green-800';
    if (score >= 70) return 'bg-blue-100 text-blue-800';
    if (score >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const filteredTeachers = teachers?.teachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const availableDepartments = departments?.departments.map(d => d.name) || [];

  const formatMetricValue = (value: number): string => {
    return value === -1 ? 'В разработке' : value.toString();
  };

  const prepareCategoryRadarData = (teacher: TeacherKpi) => {
    return [
      { category: 'Качество преподавания', score: teacher.teachingQuality === -1 ? 0 : teacher.teachingQuality },
      { category: 'Удовлетворенность студентов', score: teacher.studentSatisfaction === -1 ? 0 : teacher.studentSatisfaction },
      { category: 'Посещаемость', score: teacher.classAttendance === -1 ? 0 : teacher.classAttendance },
      { category: 'Выполнение нагрузки', score: teacher.workloadCompliance },
      { category: 'Проф. развитие', score: teacher.professionalDevelopment === -1 ? 0 : teacher.professionalDevelopment },
    ];
  };

  const handleExport = async () => {
    try {
      // Подготавливаем фильтры для экспорта
      const filter: KpiFilter = {
        department: selectedDepartment || undefined,
        period: periodFilter,
      };
      
      // Получаем blob файла
      const blob = await kpiService.exportKpi(filter, 'xlsx');
      
      // Создаем ссылку для скачивания
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

  const handleExportTeacherReport = async (teacher: TeacherKpi) => {
    try {
      // Получаем отчет по конкретному преподавателю
      const blob = await kpiService.exportTeacherReport(teacher.id, 'pdf');
      
      // Создаем ссылку для скачивания
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `kpi-teacher-report-${teacher.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Ошибка при экспорте отчета преподавателя:', error);
      alert('Произошла ошибка при экспорте отчета');
    }
  };

  const handleRecalculateKpi = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Запускаем ручной пересчет KPI
      const result = await kpiService.recalculateKpi();
      
      if (result.success) {
        // Показываем результат пересчета
        alert(`KPI успешно пересчитан!\n\nОбработано: ${result.statistics.totalTeachers} преподавателей\nУспешно: ${result.statistics.successfulUpdates}\nОшибок: ${result.statistics.failedUpdates}\nВремя: ${result.statistics.processingTime}`);
        
        // Перезагружаем данные
        await loadData();
      } else {
        throw new Error('Не удалось пересчитать KPI');
      }
    } catch (error) {
      console.error('Ошибка при пересчете KPI:', error);
      setError('Ошибка при пересчете KPI');
      alert('Произошла ошибка при пересчете KPI');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
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
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Заголовок страницы */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">KPI и эффективность</h1>
          <p className="text-gray-600 mt-1">
            Оценка эффективности и ключевые показатели деятельности персонала
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            onClick={() => setIsSettingsModalOpen(true)}
          >
            <FaCog className="mr-2" />
            Настроить KPI
          </button>
          <button 
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            onClick={handleRecalculateKpi}
            disabled={loading}
          >
            <FaChartLine className="mr-2" />
            {loading ? 'Пересчет...' : 'Пересчитать KPI'}
          </button>
          <button 
            className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            onClick={handleExport}
          >
            <FaFileExport className="mr-2" />
            Экспорт
          </button>
        </div>
      </div>

      {/* Фильтры */}
      <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-lg shadow-sm">
        <div className="flex gap-4 items-center">
          <div className="relative">
            <input
              type="text"
              placeholder="Поиск сотрудника..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-64 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
          <div className="relative">
            <select
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-64 appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
            >
              <option value="">Все кафедры</option>
              {availableDepartments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            <FaFilter className="absolute left-3 top-3 text-gray-400" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
            >
              <option value="week">Неделя</option>
              <option value="month">Месяц</option>
              <option value="quarter">Квартал</option>
              <option value="year">Год</option>
            </select>
            <FaRegClock className="absolute left-3 top-3 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Общие метрики */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-sm text-gray-600 mb-2">Общий KPI</h3>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-gray-900">{overview.overallKpi}</div>
              <div className="text-sm text-gray-500">из 100</div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-sm text-gray-600 mb-2">Достижение целей</h3>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-gray-900">{overview.goalAchievement}%</div>
              <div className="text-sm text-gray-500">целей</div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-sm text-gray-600 mb-2">Активные цели</h3>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-gray-900">{overview.activeGoals}</div>
              <div className="text-sm text-gray-500">цели</div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-sm text-gray-600 mb-2">Преподавателей</h3>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-gray-900">{overview.totalTeachers}</div>
              <div className="text-sm text-gray-500">человек</div>
            </div>
          </div>
        </div>
      )}

      {/* Детальные метрики */}
      {overview && (
        <div className="mb-8 space-y-6">
          {/* Общие показатели */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {overview.metrics.map((metric, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">{metric.name}</h4>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold text-gray-900">{metric.value}{metric.unit}</span>
                  <div className="flex items-center">
                    {getTrendIcon(metric.change)}
                    <span className="text-sm ml-1">{Math.abs(metric.change)}</span>
                  </div>
                </div>
                <div className={`text-xs px-2 py-1 rounded-full ${getStatusColor(metric.status)}`}>
                  Цель: {metric.target}{metric.unit}
                </div>
              </div>
            ))}
          </div>

          {/* Новые KPI метрики - заглушка для демонстрации */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Новые метрики KPI</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Постоянные метрики */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-green-700 border-b border-green-200 pb-1">Постоянные</h4>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">Прогресс по контрольным</div>
                  <div className="text-lg font-bold text-green-700">В разработке</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">Заполнение журнала</div>
                  <div className="text-lg font-bold text-green-700">В разработке</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">План работ</div>
                  <div className="text-lg font-bold text-green-700">В разработке</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">Доп. материалы</div>
                  <div className="text-lg font-bold text-green-700">В разработке</div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-medium text-green-700 border-b border-green-200 pb-1">&nbsp;</h4>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">Обратная связь</div>
                  <div className="text-lg font-bold text-green-700">В разработке</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">Отзывы родителей</div>
                  <div className="text-lg font-bold text-green-700">В разработке</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">Удержание учеников</div>
                  <div className="text-lg font-bold text-green-700">В разработке</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">Стабильность</div>
                  <div className="text-lg font-bold text-green-700">В разработке</div>
                </div>
              </div>

              {/* Периодические метрики */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-blue-700 border-b border-blue-200 pb-1">Периодические</h4>
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">Олимпиады</div>
                  <div className="text-lg font-bold text-blue-700">В разработке</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">РФМШ/НИШ/БИЛ</div>
                  <div className="text-lg font-bold text-blue-700">В разработке</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">Лицеи/частные</div>
                  <div className="text-lg font-bold text-blue-700">В разработке</div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-medium text-blue-700 border-b border-blue-200 pb-1">&nbsp;</h4>
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">Повышение квалификации</div>
                  <div className="text-lg font-bold text-blue-700">В разработке</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">Командные мероприятия</div>
                  <div className="text-lg font-bold text-blue-700">В разработке</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">Помощь в проектах</div>
                  <div className="text-lg font-bold text-blue-700">В разработке</div>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Примечание:</strong> Новые метрики KPI находятся в стадии разработки. 
                Для настройки метрик используйте кнопку "Настроить KPI" выше.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Графики */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Распределение метрик по типам */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Распределение метрик KPI</h3>
          <div className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Постоянные метрики', value: 90, fill: '#10B981' },
                    { name: 'Периодические метрики', value: 10, fill: '#3B82F6' }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#10B981" />
                  <Cell fill="#3B82F6" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
              <span className="text-sm text-gray-600">Постоянные: 90% веса</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
              <span className="text-sm text-gray-600">Периодические: 10% веса</span>
            </div>
          </div>
        </div>

        {/* Прогресс выполнения постоянных метрик */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Постоянные метрики (статус)</h3>
          <div className="space-y-4">
            {[
              { name: 'Прогресс по контрольным', progress: 0, status: 'В разработке', color: 'bg-gray-400' },
              { name: 'Заполнение журнала', progress: 0, status: 'В разработке', color: 'bg-gray-400' },
              { name: 'План работ', progress: 0, status: 'В разработке', color: 'bg-gray-400' },
              { name: 'Обратная связь', progress: 0, status: 'В разработке', color: 'bg-gray-400' },
              { name: 'Отзывы родителей', progress: 0, status: 'В разработке', color: 'bg-gray-400' },
              { name: 'Удержание учеников', progress: 0, status: 'В разработке', color: 'bg-gray-400' },
              { name: 'Стабильность', progress: 0, status: 'В разработке', color: 'bg-gray-400' }
            ].map((metric, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">{metric.name}</span>
                    <span className="text-xs text-gray-500">{metric.status}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${metric.color}`}
                      style={{ width: `${metric.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Дополнительные графики */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Периодические достижения */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Периодические достижения</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { category: 'Олимпиады', value: 0, target: 70 },
                  { category: 'РФМШ/НИШ', value: 0, target: 60 },
                  { category: 'Лицеи', value: 0, target: 65 },
                  { category: 'Квалификация', value: 0, target: 70 },
                  { category: 'Мероприятия', value: 0, target: 75 }
                ]}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} fontSize={10} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3B82F6" name="Текущий" />
                <Bar dataKey="target" fill="#E5E7EB" name="Цель" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Тренд KPI за год */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Тренд общего KPI</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={[
                  { month: 'Янв', kpi: 75 },
                  { month: 'Фев', kpi: 77 },
                  { month: 'Мар', kpi: 79 },
                  { month: 'Апр', kpi: 81 },
                  { month: 'Май', kpi: 78 },
                  { month: 'Июн', kpi: 82 },
                  { month: 'Июл', kpi: 85 },
                  { month: 'Авг', kpi: 83 }
                ]}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[60, 100]} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="kpi" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Топ преподаватели по новым критериям */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Готовность к новым метрикам</h3>
          <div className="space-y-3">
            {teachers?.teachers.slice(0, 6).map((teacher, index) => (
              <div key={teacher.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-xs font-medium text-blue-600">#{index + 1}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-700 truncate">
                    {teacher.name.split(' ').slice(0, 2).join(' ')}
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                    <div 
                      className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-2 rounded-full"
                      style={{ width: '25%' }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500">25%</span>
                </div>
              </div>
            )) || []}
            <div className="mt-4 text-xs text-gray-500 text-center">
              Показатель готовности к внедрению новых метрик
            </div>
          </div>
        </div>
      </div>

      {/* Таблица преподавателей */}
      {teachers && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Рейтинг преподавателей</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Рейтинг
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Преподаватель
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Общий KPI
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Качество
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Удовлетворенность
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Посещаемость
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Тренд
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTeachers.slice(0, 10).map((teacher) => (
                  <tr
                    key={teacher.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setSelectedTeacher(teacher);
                      setIsModalOpen(true);
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{teacher.rank}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{teacher.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(teacher.overallScore)}`}>
                        {teacher.overallScore}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatMetricValue(teacher.teachingQuality)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatMetricValue(teacher.studentSatisfaction)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatMetricValue(teacher.classAttendance)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getTrendIcon(teacher.trend)}
                        <span className="ml-1 text-sm">{Math.abs(teacher.trend)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Статистика */}
      {teachers && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-2xl font-bold text-gray-900">{teachers.statistics.averageKpi}</div>
            <div className="text-sm text-gray-600">Средний KPI</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-2xl font-bold text-green-600">{teachers.statistics.topPerformers}</div>
            <div className="text-sm text-gray-600">Топ исполнители</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-2xl font-bold text-blue-600">{teachers.statistics.onTrack}</div>
            <div className="text-sm text-gray-600">В норме</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-2xl font-bold text-red-600">{teachers.statistics.needsImprovement}</div>
            <div className="text-sm text-gray-600">Требуют внимания</div>
          </div>
        </div>
      )}

      {/* Модальное окно детальной информации */}
      {isModalOpen && selectedTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-5/6 max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedTeacher.name}</h2>
                  <p className="text-gray-600">Детальная информация о KPI</p>
                </div>
                <div className="flex items-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mr-4 ${getScoreColor(selectedTeacher.overallScore)}`}>
                    <span className="font-bold text-2xl">{selectedTeacher.overallScore}</span>
                  </div>
                  <button
                    className="text-gray-500 hover:text-gray-700"
                    onClick={() => setIsModalOpen(false)}
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Радар-график */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4">Профиль компетенций</h3>
                  <div className="h-[300px]">
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
                        />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Детальные показатели */}
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Качество преподавания</span>
                      <span className="text-lg font-bold">{formatMetricValue(selectedTeacher.teachingQuality)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${selectedTeacher.teachingQuality === -1 ? 0 : selectedTeacher.teachingQuality}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Удовлетворенность студентов</span>
                      <span className="text-lg font-bold">{formatMetricValue(selectedTeacher.studentSatisfaction)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${selectedTeacher.studentSatisfaction === -1 ? 0 : selectedTeacher.studentSatisfaction}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Посещаемость занятий</span>
                      <span className="text-lg font-bold">{formatMetricValue(selectedTeacher.classAttendance)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ width: `${selectedTeacher.classAttendance === -1 ? 0 : selectedTeacher.classAttendance}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Выполнение нагрузки</span>
                      <span className="text-lg font-bold">{formatMetricValue(selectedTeacher.workloadCompliance)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full"
                        style={{ width: `${selectedTeacher.workloadCompliance === -1 ? 0 : selectedTeacher.workloadCompliance}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Профессиональное развитие</span>
                      <span className="text-lg font-bold">{formatMetricValue(selectedTeacher.professionalDevelopment)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full"
                        style={{ width: `${selectedTeacher.professionalDevelopment === -1 ? 0 : selectedTeacher.professionalDevelopment}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t mt-6">
                <button 
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg mr-2 hover:bg-gray-300 transition-colors"
                  onClick={() => handleExportTeacherReport(selectedTeacher)}
                >
                  Выгрузить отчет
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Редактировать KPI
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно настроек KPI */}
      <KpiSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSave={() => {
          // Перезагружаем данные после сохранения настроек
          loadData();
        }}
      />
    </div>
  );
};

export default KPI;
