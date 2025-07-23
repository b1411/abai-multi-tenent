import React, { useState } from 'react';
import {
  FaDownload,
  FaSearch,
  FaFileExport,
  FaCalendarAlt,
  FaClock,
  FaChevronDown,
  FaEdit,
  FaSave,
  FaTimes,
  FaPlus
} from 'react-icons/fa';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useWorkloads, useWorkloadAnalytics } from '../hooks/useWorkload';
import { useTeachers } from '../hooks/useTeachers';
import type { TeacherWorkload, WorkloadType, AddDailyHoursData } from '../types/workload';
import { Spinner } from '../components/ui/Spinner';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

type PeriodType = 'month' | 'quarter' | 'year';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    dataKey: string;
    color: string;
  }>;
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const getMonthName = (month: number): string => {
    const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    return months[month - 1];
  };

  const formatLabel = (label: string | undefined) => {
    if (!label) return '';
    const monthNumber = parseInt(label);
    if (!isNaN(monthNumber) && monthNumber >= 1 && monthNumber <= 12) {
      return getMonthName(monthNumber);
    }
    return label;
  };

  return (
    <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
      <p className="font-medium text-gray-900 mb-1">
        {formatLabel(label)}
      </p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-600">{entry.name}:</span>
          <span className="font-medium">{entry.value} ч.</span>
        </div>
      ))}
    </div>
  );
};

const WorkloadPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorkload, setSelectedWorkload] = useState<TeacherWorkload | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [periodType, setPeriodType] = useState<PeriodType>('year');
  const [selectedPeriod, setSelectedPeriod] = useState<number>(new Date().getMonth() + 1);
  const [isEditing, setIsEditing] = useState(false);
  const [showDailyHours, setShowDailyHours] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newDailyRecord, setNewDailyRecord] = useState<AddDailyHoursData>({
    date: new Date().toISOString().split('T')[0],
    hours: 0,
    type: 'REGULAR',
    comment: ''
  });

  const currentYear = new Date().getFullYear().toString();
  
  const { 
    workloads, 
    loading: workloadsLoading, 
    error: workloadsError,
    fetchWorkloads 
  } = useWorkloads({ 
    academicYear: currentYear,
    page: 1, 
    limit: 50 
  });

  const { 
    analytics, 
    loading: analyticsLoading 
  } = useWorkloadAnalytics({ 
    academicYear: currentYear 
  });

  const { teachers } = useTeachers();

  const getMonthName = (month: number): string => {
    const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    return months[month - 1];
  };

  const getQuarterName = (quarter: number): string => {
    return `${quarter} четверть`;
  };

  const getPeriodData = (workload: TeacherWorkload) => {
    switch (periodType) {
      case 'month': {
        const monthData = workload.monthlyHours.find(m => m.month === selectedPeriod);
        return {
          standardHours: monthData?.standardHours || 0,
          actualHours: monthData?.actualHours || 0
        };
      }
      case 'quarter': {
        const quarterData = workload.quarterlyHours.find(q => q.quarter === selectedPeriod);
        return {
          standardHours: quarterData?.standardHours || 0,
          actualHours: quarterData?.actualHours || 0
        };
      }
      default:
        return {
          standardHours: workload.standardHours,
          actualHours: workload.actualHours
        };
    }
  };

  const filteredWorkloads = workloads?.data.filter(workload => {
    const teacherName = `${workload.teacher.user.name} ${workload.teacher.user.surname}`;
    return teacherName.toLowerCase().includes(searchTerm.toLowerCase());
  }) || [];

  // Данные для диаграммы нагрузки преподавателей
  const teacherWorkloadData = filteredWorkloads.map(workload => {
    const periodData = getPeriodData(workload);
    const teacherName = `${workload.teacher.user.name} ${workload.teacher.user.surname}`;
    return {
      name: teacherName.length > 15 ? 
        `${workload.teacher.user.surname} ${workload.teacher.user.name.charAt(0)}.` :
        teacherName,
      standardHours: periodData.standardHours,
      actualHours: periodData.actualHours,
      difference: periodData.actualHours - periodData.standardHours
    };
  });

  // Данные для диаграммы предметов из аналитики
  const subjectWorkloadData = analytics?.subjectDistribution.map(subject => ({
    name: subject.name,
    hours: subject.hours,
    value: subject.hours
  })) || [];

  const handleWorkloadClick = (workload: TeacherWorkload) => {
    setSelectedWorkload(workload);
    setIsModalOpen(true);
  };

  const handleAddDailyHours = () => {
    // В реальном приложении здесь будет вызов API
    setShowDailyHours(false);
    setNewDailyRecord({
      date: new Date().toISOString().split('T')[0],
      hours: 0,
      type: 'REGULAR',
      comment: ''
    });
  };

  const getWorkloadTypeLabel = (type: WorkloadType): string => {
    switch (type) {
      case 'REGULAR': return 'Обычные';
      case 'OVERTIME': return 'Сверхурочные';
      case 'SICK': return 'Больничный';
      case 'VACATION': return 'Отпуск';
      default: return type;
    }
  };

  const getWorkloadTypeColor = (type: WorkloadType): string => {
    switch (type) {
      case 'REGULAR': return 'bg-green-100 text-green-800';
      case 'OVERTIME': return 'bg-blue-100 text-blue-800';
      case 'SICK': return 'bg-red-100 text-red-800';
      case 'VACATION': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (workloadsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  if (workloadsError) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600">Ошибка: {workloadsError}</p>
        <button 
          onClick={() => fetchWorkloads()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Нагрузки и расписание ставок</h1>
            <p className="text-sm text-gray-500">Управление педагогической нагрузкой и ставками</p>
          </div>
          <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm border border-gray-200 p-1">
            <select
              className="pl-8 pr-2 py-1.5 text-sm border-0 bg-transparent focus:ring-0 appearance-none cursor-pointer"
              value={periodType}
              onChange={(e) => {
                setPeriodType(e.target.value as PeriodType);
                setSelectedPeriod(e.target.value === 'month' ? new Date().getMonth() + 1 : 1);
              }}
            >
              <option value="year">За год</option>
              <option value="quarter">По четвертям</option>
              <option value="month">По месяцам</option>
            </select>
            <FaCalendarAlt className="absolute ml-2 text-gray-400 pointer-events-none" />

            {periodType !== 'year' && (
              <>
                <div className="w-px h-6 bg-gray-200"></div>
                <select
                  className="pl-2 pr-6 py-1.5 text-sm border-0 bg-transparent focus:ring-0 appearance-none cursor-pointer"
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(Number(e.target.value))}
                >
                  {periodType === 'month' ? (
                    Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                      <option key={month} value={month}>{getMonthName(month)}</option>
                    ))
                  ) : (
                    Array.from({ length: 4 }, (_, i) => i + 1).map(quarter => (
                      <option key={quarter} value={quarter}>{getQuarterName(quarter)}</option>
                    ))
                  )}
                </select>
                <FaChevronDown className="absolute right-3 text-gray-400 pointer-events-none" />
              </>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center">
            <FaDownload className="mr-2" />
            Загрузить шаблон
          </button>
          <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md flex items-center">
            <FaFileExport className="mr-2" />
            Экспорт
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-md p-4">
          <h2 className="text-lg font-semibold mb-4">Нагрузка преподавателей</h2>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={teacherWorkloadData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                />
                <YAxis
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  label={{
                    value: 'Часы',
                    angle: -90,
                    position: 'insideLeft',
                    style: { fill: '#6B7280' }
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{
                    paddingTop: "20px",
                    fontSize: "14px"
                  }}
                />
                <Bar
                  dataKey="standardHours"
                  name="Норма часов"
                  fill="#8884d8"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="actualHours"
                  name="Фактические часы"
                  fill="#82ca9d"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4">
          <h2 className="text-lg font-semibold mb-4">Распределение по предметам</h2>
          <div className="h-[400px] relative">
            {analyticsLoading ? (
              <div className="flex items-center justify-center h-full">
                <Spinner />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={subjectWorkloadData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={140}
                    fill="#8884d8"
                    paddingAngle={2}
                    dataKey="hours"
                  >
                    {subjectWorkloadData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        strokeWidth={1}
                        stroke="#fff"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0];
                        return (
                          <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                            <p className="font-medium text-gray-900 mb-1">{data.name}</p>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: data.color }}
                              />
                              <span className="text-gray-600">{data.value} часов</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    content={({ payload }) => {
                      if (!payload) return null;
                      return (
                        <div className="flex flex-col gap-2 absolute right-0 top-1/2 transform -translate-y-1/2 pr-4">
                          {payload.map((entry, index) => (
                            <div key={`legend-${index}`} className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: entry.color }}
                              />
                              <span className="text-sm text-gray-600">
                                {entry.value} ({subjectWorkloadData[index]?.hours || 0} ч.)
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          {analytics && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Всего предметов: {analytics.subjectDistribution.length}</span>
                <span>
                  Общая нагрузка: {analytics.subjectDistribution.reduce((sum, item) => sum + item.hours, 0)} ч.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4 items-center">
          <div className="relative">
            <input
              type="text"
              placeholder="Поиск преподавателя..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Преподаватель
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Нормативная нагрузка
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Фактическая нагрузка
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Отклонение
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredWorkloads.map((workload) => {
              const periodData = getPeriodData(workload);
              const teacherName = `${workload.teacher.user.name} ${workload.teacher.user.surname}`;
              return (
                <tr
                  key={workload.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleWorkloadClick(workload)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{teacherName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {periodData.standardHours} ч.
                    <div className="text-xs text-gray-400">
                      {periodType === 'month' ? getMonthName(selectedPeriod) :
                        periodType === 'quarter' ? getQuarterName(selectedPeriod) :
                          'За год'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {periodData.actualHours} ч.
                    <div className="text-xs text-gray-400">
                      {periodType === 'month' ? getMonthName(selectedPeriod) :
                        periodType === 'quarter' ? getQuarterName(selectedPeriod) :
                          'За год'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${periodData.actualHours > periodData.standardHours ? 'bg-red-100 text-red-800' :
                          periodData.actualHours < periodData.standardHours ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'}`}>
                        {periodData.actualHours - periodData.standardHours} ч.
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Модальное окно с подробностями о нагрузке преподавателя */}
      {isModalOpen && selectedWorkload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-4/5 max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedWorkload.teacher.user.name} {selectedWorkload.teacher.user.surname}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  {!isEditing ? (
                    <button
                      className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center gap-2"
                      onClick={() => setIsEditing(true)}
                    >
                      <FaEdit />
                      Редактировать нагрузку
                    </button>
                  ) : (
                    <>
                      <button
                        className="px-4 py-2 bg-gray-500 text-white rounded-md flex items-center gap-2"
                        onClick={() => setIsEditing(false)}
                      >
                        <FaTimes />
                        Отменить
                      </button>
                      <button
                        className="px-4 py-2 bg-green-600 text-white rounded-md flex items-center gap-2"
                        onClick={() => setIsEditing(false)}
                      >
                        <FaSave />
                        Сохранить
                      </button>
                    </>
                  )}
                  <button
                    className="text-gray-500 hover:text-gray-700 ml-2"
                    onClick={() => {
                      setIsModalOpen(false);
                      setIsEditing(false);
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-blue-700">Нормативная нагрузка</div>
                  <div className="text-2xl font-bold">
                    {selectedWorkload.standardHours} ч.
                  </div>
                  <div className="text-sm font-normal text-blue-600">За год</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm text-green-700">Фактическая нагрузка</div>
                  <div className="text-2xl font-bold">
                    {selectedWorkload.actualHours} ч.
                  </div>
                  <div className="text-sm font-normal text-green-600">За год</div>
                </div>
                <div className={`p-4 rounded-lg ${
                  selectedWorkload.actualHours > selectedWorkload.standardHours ? 'bg-red-50 text-red-700' :
                  selectedWorkload.actualHours < selectedWorkload.standardHours ? 'bg-yellow-50 text-yellow-700' :
                    'bg-green-50 text-green-700'
                  }`}>
                  <div className="text-sm">Отклонение</div>
                  <div className="text-2xl font-bold">
                    {selectedWorkload.actualHours - selectedWorkload.standardHours} ч.
                  </div>
                </div>
              </div>

              {/* График нагрузки по периодам */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 border-b pb-2">Динамика нагрузки</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={periodType === 'month' ? selectedWorkload.monthlyHours : selectedWorkload.quarterlyHours}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey={periodType === 'month' ? 'month' : 'quarter'}
                        tickFormatter={value =>
                          periodType === 'month' ? getMonthName(value).substring(0, 3) : `${value} чет.`
                        }
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                      />
                      <YAxis
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                        label={{
                          value: 'Часы',
                          angle: -90,
                          position: 'insideLeft',
                          style: { fill: '#6B7280' }
                        }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar
                        dataKey="standardHours"
                        name="Норма часов"
                        fill="#8884d8"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="actualHours"
                        name="Фактические часы"
                        fill="#82ca9d"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Распределение нагрузки по предметам */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 border-b pb-2">Распределение нагрузки по предметам</h3>
                <div className="overflow-x-auto rounded-lg border">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Предмет
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Часы
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Учебный план
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedWorkload.subjectWorkloads.map((subject, idx) => (
                        <tr key={idx}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {subject.subjectName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {subject.hours} ч.
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {subject.studyPlan?.name || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Дополнительная нагрузка */}
              {selectedWorkload.additionalActivities.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 border-b pb-2">Дополнительная нагрузка</h3>
                  <div className="space-y-3">
                    {selectedWorkload.additionalActivities.map((activity, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between">
                          <span className="font-medium">{activity.name}</span>
                          <span className="text-gray-700">{activity.hours} ч.</span>
                        </div>
                        {activity.description && (
                          <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FaCalendarAlt className="text-blue-500 mr-2" />
                      <span className="text-sm text-gray-700">Отпуск</span>
                    </div>
                    <span className="font-semibold">{selectedWorkload.vacationDays} дней</span>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FaClock className="text-yellow-500 mr-2" />
                      <span className="text-sm text-gray-700">Больничный</span>
                    </div>
                    <span className="font-semibold">{selectedWorkload.sickLeaveDays} дней</span>
                  </div>
                </div>
              </div>

              {/* Ежедневный учет часов */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Ежедневный учет часов</h3>
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center gap-2"
                    onClick={() => setShowDailyHours(true)}
                  >
                    <FaPlus />
                    Добавить часы
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Дата</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Часы</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Тип</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Комментарий</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedWorkload.dailyHours
                        ?.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((record, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 whitespace-nowrap">
                            {new Date(record.date).toLocaleDateString('ru-RU')}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            {record.hours}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getWorkloadTypeColor(record.type)}`}>
                              {getWorkloadTypeLabel(record.type)}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            {record.comment || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md mr-2">
                  Выгрузить данные
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md">
                  Редактировать нагрузку
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно добавления часов */}
      {showDailyHours && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h4 className="text-lg font-semibold mb-4">Добавить рабочие часы</h4>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Дата
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border rounded-md"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Количество часов
                </label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  className="w-full px-3 py-2 border rounded-md"
                  value={newDailyRecord.hours}
                  onChange={(e) => setNewDailyRecord({
                    ...newDailyRecord,
                    hours: Number(e.target.value)
                  })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Тип
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-md"
                  value={newDailyRecord.type}
                  onChange={(e) => setNewDailyRecord({
                    ...newDailyRecord,
                    type: e.target.value as WorkloadType
                  })}
                >
                  <option value="REGULAR">Обычные часы</option>
                  <option value="OVERTIME">Сверхурочные</option>
                  <option value="SICK">Больничный</option>
                  <option value="VACATION">Отпуск</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Комментарий
                </label>
                <textarea
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                  value={newDailyRecord.comment}
                  onChange={(e) => setNewDailyRecord({
                    ...newDailyRecord,
                    comment: e.target.value
                  })}
                  placeholder="Необязательный комментарий..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md"
                onClick={() => setShowDailyHours(false)}
              >
                Отмена
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md"
                onClick={handleAddDailyHours}
              >
                Добавить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkloadPage;
