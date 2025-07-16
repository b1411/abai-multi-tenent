import React, { useState, ReactElement, FC } from 'react';
import { IconType } from 'react-icons';
import { IconBaseProps } from 'react-icons/lib';
import {
  FaDownload,
  FaSearch,
  FaFileExport,
  FaSortAmountDown,
  FaCalendarAlt,
  FaClock,
  FaChevronDown,
  FaUser,
  FaEdit,
  FaSave,
  FaTimes
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
  Cell,
  PieLabel
} from 'recharts';

interface WorkloadPeriod {
  standardHours: number;
  actualHours: number;
  quarter?: number;
  month?: number;
}

interface MonthlyWorkload {
  month: number;
  standardHours: number;
  actualHours: number;
}

interface QuarterlyWorkload {
  quarter: number;
  standardHours: number;
  actualHours: number;
}

interface DailyWorkload {
  date: string;
  hours: number;
  type: WorkloadType;
  comment: string;
}

interface Subject {
  name: string;
  hours: number;
  classes: string[];
}

interface AdditionalActivity {
  name: string;
  hours: number;
  description: string;
}

type WorkloadType = 'regular' | 'overtime' | 'sick' | 'vacation';

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    dataKey: string;
    color: string;
  }>;
  label?: string;
  getMonthName: (month: number) => string;
}

const CustomTooltip: React.FC<TooltipProps> = ({ active, payload, label, getMonthName }) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const formatLabel = (label: string | undefined) => {
    if (!label) return '';
    // Check if label is a month number
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

interface CustomLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  index: number;
  value: number;
}

interface IconProps extends IconBaseProps {
  icon: IconType;
}

const Icon: FC<IconProps> = ({ icon: IconComponent, ...props }) => {
  return <IconComponent {...props} />;
};

interface TeacherWorkload {
  id: number;
  name: string;
  standardHours: number;
  actualHours: number;
  monthlyHours: MonthlyWorkload[];
  quarterlyHours: QuarterlyWorkload[];
  dailyHours: DailyWorkload[];
  overtimeHours: number;
  vacationDays: number;
  sickLeaveDays: number;
  subjects: Subject[];
  additionalActivities: AdditionalActivity[];
}

interface EditedHours {
  standardHours: number;
  actualHours: number;
  monthlyHours: MonthlyWorkload[];
  quarterlyHours: QuarterlyWorkload[];
  dailyHours: DailyWorkload[];
}

interface DailyRecord {
  hours: number;
  type: WorkloadType;
  comment: string;
}

const initialTeachers: TeacherWorkload[] = [
  {
    id: 1,
    name: "Иванов Иван Иванович",
    standardHours: 180,
    actualHours: 165,
    monthlyHours: [
      { month: 1, standardHours: 15, actualHours: 14 },
      { month: 2, standardHours: 15, actualHours: 13 },
      { month: 3, standardHours: 15, actualHours: 15 },
      { month: 4, standardHours: 15, actualHours: 14 },
      { month: 5, standardHours: 15, actualHours: 15 },
      { month: 6, standardHours: 15, actualHours: 13 },
      { month: 7, standardHours: 15, actualHours: 14 },
      { month: 8, standardHours: 15, actualHours: 15 },
      { month: 9, standardHours: 15, actualHours: 14 },
      { month: 10, standardHours: 15, actualHours: 13 },
      { month: 11, standardHours: 15, actualHours: 15 },
      { month: 12, standardHours: 15, actualHours: 14 }
    ],
    quarterlyHours: [
      { quarter: 1, standardHours: 45, actualHours: 42 },
      { quarter: 2, standardHours: 45, actualHours: 42 },
      { quarter: 3, standardHours: 45, actualHours: 43 },
      { quarter: 4, standardHours: 45, actualHours: 42 }
    ],
    dailyHours: [],
    overtimeHours: 5,
    vacationDays: 0,
    sickLeaveDays: 0,
    subjects: [
      {
        name: "Математика",
        hours: 60,
        classes: ["5A", "5Б", "6A"]
      },
      {
        name: "Алгебра",
        hours: 45,
        classes: ["7A", "7Б", "8A"]
      },
      {
        name: "Геометрия",
        hours: 35,
        classes: ["7A", "7Б", "8A"]
      },
      {
        name: "Физика",
        hours: 25,
        classes: ["9A", "9Б"]
      }
    ],
    additionalActivities: [
      {
        name: "Классное руководство",
        hours: 10,
        description: "Классное руководство 7А класса"
      },
      {
        name: "Внеурочная деятельность",
        hours: 5,
        description: "Математический кружок"
      }
    ]
  }
];

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const WorkloadPage: React.FC = () => {
  const [teachers, setTeachers] = useState<TeacherWorkload[]>(initialTeachers);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherWorkload | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [periodType, setPeriodType] = useState<'month' | 'quarter' | 'year'>('year');
  const [selectedPeriod, setSelectedPeriod] = useState<number>(new Date().getMonth() + 1);
  const [isEditing, setIsEditing] = useState(false);
  const [editedHours, setEditedHours] = useState<EditedHours | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showDailyHours, setShowDailyHours] = useState(false);
  const [newDailyRecord, setNewDailyRecord] = useState<DailyRecord>({
    hours: 0,
    type: 'regular',
    comment: ''
  });
  const [selectedWorkloadType, setSelectedWorkloadType] = useState<WorkloadType>('regular');
  const [selectedTeachers, setSelectedTeachers] = useState<TeacherWorkload[]>([]);
  const [totalHours, setTotalHours] = useState<number>(0);

  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = teacher.name.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const getMonthName = (month: number): string => {
    const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    return months[month - 1];
  };

  const getQuarterName = (quarter: number): string => {
    return `${quarter} четверть`;
  };

  const getPeriodData = (teacher: TeacherWorkload) => {
    switch (periodType) {
      case 'month':
        const monthData = teacher.monthlyHours.find(m => m.month === selectedPeriod);
        return {
          standardHours: monthData?.standardHours || 0,
          actualHours: monthData?.actualHours || 0
        };
      case 'quarter':
        const quarterData = teacher.quarterlyHours.find(q => q.quarter === selectedPeriod);
        return {
          standardHours: quarterData?.standardHours || 0,
          actualHours: quarterData?.actualHours || 0
        };
      default:
        return {
          standardHours: teacher.standardHours,
          actualHours: teacher.actualHours
        };
    }
  };

  // Данные для диаграммы нагрузки преподавателей
  const teacherWorkloadData = filteredTeachers.map(teacher => {
    const periodData = getPeriodData(teacher);
    return {
      name: teacher.name.split(' ')[0] + ' ' + teacher.name.split(' ')[1].charAt(0) + '.',
      standardHours: periodData.standardHours,
      actualHours: periodData.actualHours,
      difference: periodData.actualHours - periodData.standardHours
    };
  });

  // Обновляем расчет данных для диаграммы предметов
  const subjectWorkload = Array.from(new Set(
    teachers.flatMap(t => t.subjects.map(s => s.name))
  )).map(subjectName => {
    const hours = teachers.reduce((sum, teacher) => {
      const subject = teacher.subjects.find(s => s.name === subjectName);
      return sum + (subject?.hours || 0);
    }, 0);

    return {
      name: subjectName,
      hours,
      value: hours // добавляем value для совместимости с Recharts
    };
  }).sort((a, b) => b.hours - a.hours);

  const handleTeacherClick = (teacher: TeacherWorkload) => {
    setSelectedTeacher(teacher);
    setEditedHours({
      standardHours: teacher.standardHours,
      actualHours: teacher.actualHours,
      monthlyHours: [...teacher.monthlyHours],
      quarterlyHours: [...teacher.quarterlyHours],
      dailyHours: [...teacher.dailyHours]
    });
    setIsModalOpen(true);
  };

  const handleSaveChanges = () => {
    if (!selectedTeacher || !editedHours) return;

    const updatedTeachers = teachers.map(teacher => {
      if (teacher.id === selectedTeacher.id) {
        return {
          ...teacher,
          standardHours: editedHours.standardHours,
          actualHours: editedHours.actualHours,
          monthlyHours: editedHours.monthlyHours,
          quarterlyHours: editedHours.quarterlyHours,
          dailyHours: editedHours.dailyHours || []
        };
      }
      return teacher;
    });

    setTeachers(updatedTeachers);
    setIsEditing(false);
  };

  const handleHoursChange = (type: 'standard' | 'actual', period: 'year' | 'month' | 'quarter', index?: number, value?: number) => {
    if (!editedHours) return;

    const newEditedHours = { ...editedHours };

    if (period === 'year') {
      if (type === 'standard') {
        newEditedHours.standardHours = value || 0;
      } else {
        newEditedHours.actualHours = value || 0;
      }
    } else if (period === 'month' && typeof index === 'number') {
      const monthData = newEditedHours.monthlyHours[index];
      if (monthData) {
        if (type === 'standard') {
          monthData.standardHours = value || 0;
        } else {
          monthData.actualHours = value || 0;
        }
      }
    } else if (period === 'quarter' && typeof index === 'number') {
      const quarterData = newEditedHours.quarterlyHours[index];
      if (quarterData) {
        if (type === 'standard') {
          quarterData.standardHours = value || 0;
        } else {
          quarterData.actualHours = value || 0;
        }
      }
    }

    // Пересчитываем общие часы
    if (period !== 'year') {
      newEditedHours.standardHours = type === 'standard'
        ? (period === 'month'
          ? newEditedHours.monthlyHours.reduce((sum, m) => sum + m.standardHours, 0)
          : newEditedHours.quarterlyHours.reduce((sum, q) => sum + q.standardHours, 0))
        : newEditedHours.standardHours;

      newEditedHours.actualHours = type === 'actual'
        ? (period === 'month'
          ? newEditedHours.monthlyHours.reduce((sum, m) => sum + m.actualHours, 0)
          : newEditedHours.quarterlyHours.reduce((sum, q) => sum + q.actualHours, 0))
        : newEditedHours.actualHours;
    }

    setEditedHours(newEditedHours);
  };

  const handleAddDailyHours = () => {
    if (!selectedTeacher || !editedHours) return;

    const newDailyHours: DailyWorkload = {
      date: selectedDate,
      hours: newDailyRecord.hours,
      type: newDailyRecord.type,
      comment: newDailyRecord.comment
    };

    const updatedHours: EditedHours = {
      ...editedHours,
      dailyHours: [...editedHours.dailyHours, newDailyHours]
    };

    // Пересчитываем фактические часы
    const monthIndex = new Date(selectedDate).getMonth();
    const monthData = updatedHours.monthlyHours[monthIndex];
    if (monthData) {
      monthData.actualHours += newDailyRecord.hours;
    }

    setEditedHours(updatedHours);
    setNewDailyRecord({ hours: 0, type: 'regular', comment: '' });
  };

  type Period = MonthlyWorkload | QuarterlyWorkload;

  const handlePeriodSelect = (period: Period): void => {
    if ('month' in period) {
      setSelectedPeriod(period.month);
      setPeriodType('month');
    } else if ('quarter' in period) {
      setSelectedPeriod(period.quarter);
      setPeriodType('quarter');
    }
  };

  const calculateTotalHours = (workload: MonthlyWorkload | QuarterlyWorkload): number => {
    return workload.standardHours + workload.actualHours;
  };

  const calculateStandardHours = (workload: TeacherWorkload): number => {
    return workload.standardHours || 0;
  };

  const handleWorkloadTypeChange = (type: WorkloadType) => {
    setSelectedWorkloadType(type);
  };

  const handleTeacherSelect = (teachers: TeacherWorkload[]) => {
    const validTeachers = teachers.map(teacher => ({
      ...teacher,
      dailyHours: teacher.dailyHours || []
    }));
    setSelectedTeachers(validTeachers);
    const total = validTeachers.reduce((sum, teacher) => sum + (teacher.standardHours || 0), 0);
    setTotalHours(total);
  };

  const renderCustomizedLabel: React.FC<CustomLabelProps> = (props) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent, value, index } = props;
    const RADIAN = Math.PI / 180;
    const radius = 25 + innerRadius + (outerRadius - innerRadius);
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="#374151"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-sm"
      >
        {`${subjectWorkload[index].name} (${value} ч.)`}
      </text>
    );
  };

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
                setPeriodType(e.target.value as 'month' | 'quarter' | 'year');
                setSelectedPeriod(e.target.value === 'month' ? new Date().getMonth() + 1 : 1);
              }}
            >
              <option value="year">За год</option>
              <option value="quarter">По четвертям</option>
              <option value="month">По месяцам</option>
            </select>
            <Icon icon={FaCalendarAlt} className="absolute ml-2 text-gray-400 pointer-events-none" />

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
                <Icon icon={FaChevronDown} className="absolute right-3 text-gray-400 pointer-events-none" style={{ marginLeft: periodType === 'month' ? '180px' : '140px' }} />
              </>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center">
            <Icon icon={FaDownload} className="mr-2" />
            Загрузить шаблон
          </button>
          <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md flex items-center">
            <Icon icon={FaFileExport} className="mr-2" />
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
                <Tooltip content={<CustomTooltip getMonthName={getMonthName} />} />
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
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={subjectWorkload}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={140}
                  fill="#8884d8"
                  paddingAngle={2}
                  dataKey="hours"
                >
                  {subjectWorkload.map((entry, index) => (
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
                              {entry.value} ({subjectWorkload[index].hours} ч.)
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Всего предметов: {subjectWorkload.length}</span>
              <span>
                Общая нагрузка: {subjectWorkload.reduce((sum, item) => sum + item.hours, 0)} ч.
              </span>
            </div>
          </div>
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
            <Icon icon={FaSearch} className="absolute left-3 top-3 text-gray-400" />
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
            {filteredTeachers.map((teacher) => {
              const periodData = getPeriodData(teacher);
              return (
                <tr
                  key={teacher.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleTeacherClick(teacher)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{teacher.name}</div>
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
      {isModalOpen && selectedTeacher && editedHours && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-4/5 max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedTeacher.name}</h2>
                </div>
                <div className="flex items-center gap-2">
                  {!isEditing ? (
                    <button
                      className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center gap-2"
                      onClick={() => setIsEditing(true)}
                    >
                      <Icon icon={FaEdit} />
                      Редактировать нагрузку
                    </button>
                  ) : (
                    <>
                      <button
                        className="px-4 py-2 bg-gray-500 text-white rounded-md flex items-center gap-2"
                        onClick={() => {
                          setIsEditing(false);
                          setEditedHours({
                            standardHours: selectedTeacher.standardHours,
                            actualHours: selectedTeacher.actualHours,
                            monthlyHours: [...selectedTeacher.monthlyHours],
                            quarterlyHours: [...selectedTeacher.quarterlyHours],
                            dailyHours: [...selectedTeacher.dailyHours]
                          });
                        }}
                      >
                        <Icon icon={FaTimes} />
                        Отменить
                      </button>
                      <button
                        className="px-4 py-2 bg-green-600 text-white rounded-md flex items-center gap-2"
                        onClick={handleSaveChanges}
                      >
                        <Icon icon={FaSave} />
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
                  {isEditing ? (
                    <input
                      type="number"
                      className="w-full mt-1 px-3 py-2 border rounded-md"
                      value={editedHours.standardHours}
                      onChange={(e) => handleHoursChange('standard', 'year', undefined, Number(e.target.value))}
                    />
                  ) : (
                    <div className="text-2xl font-bold">
                      {editedHours.standardHours} ч.
                    </div>
                  )}
                  <div className="text-sm font-normal text-blue-600">
                    {periodType === 'month' ? getMonthName(selectedPeriod) :
                      periodType === 'quarter' ? getQuarterName(selectedPeriod) :
                        'За год'}
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm text-green-700">Фактическая нагрузка</div>
                  {isEditing ? (
                    <input
                      type="number"
                      className="w-full mt-1 px-3 py-2 border rounded-md"
                      value={editedHours.actualHours}
                      onChange={(e) => handleHoursChange('actual', 'year', undefined, Number(e.target.value))}
                    />
                  ) : (
                    <div className="text-2xl font-bold">
                      {editedHours.actualHours} ч.
                    </div>
                  )}
                  <div className="text-sm font-normal text-green-600">
                    {periodType === 'month' ? getMonthName(selectedPeriod) :
                      periodType === 'quarter' ? getQuarterName(selectedPeriod) :
                        'За год'}
                  </div>
                </div>
                <div className={`p-4 rounded-lg ${editedHours.actualHours > editedHours.standardHours ? 'bg-red-50 text-red-700' :
                  editedHours.actualHours < editedHours.standardHours ? 'bg-yellow-50 text-yellow-700' :
                    'bg-green-50 text-green-700'
                  }`}>
                  <div className="text-sm">Отклонение</div>
                  <div className="text-2xl font-bold">
                    {editedHours.actualHours - editedHours.standardHours} ч.
                  </div>
                </div>
              </div>

              {/* График нагрузки по периодам с возможностью редактирования */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 border-b pb-2">Динамика нагрузки</h3>
                {isEditing ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Период</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Норма часов</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Фактические часы</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Отклонение</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {(periodType === 'month' ? editedHours.monthlyHours : editedHours.quarterlyHours).map((period, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-2">
                              {'month' in period ? getMonthName(period.month) : `${period.quarter} четверть`}
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="number"
                                className="w-24 px-2 py-1 border rounded focus:ring-blue-500 focus:border-blue-500"
                                value={period.standardHours}
                                onChange={(e) => handleHoursChange('standard', periodType, index, Number(e.target.value))}
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="number"
                                className="w-24 px-2 py-1 border rounded focus:ring-blue-500 focus:border-blue-500"
                                value={period.actualHours}
                                onChange={(e) => handleHoursChange('actual', periodType, index, Number(e.target.value))}
                              />
                            </td>
                            <td className="px-4 py-2">
                              <span className={
                                period.actualHours > period.standardHours ? 'text-red-600' :
                                  period.actualHours < period.standardHours ? 'text-yellow-600' :
                                    'text-green-600'
                              }>
                                {period.actualHours - period.standardHours} ч.
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={periodType === 'month' ? editedHours.monthlyHours : editedHours.quarterlyHours}
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
                        <Tooltip content={<CustomTooltip getMonthName={getMonthName} />} />
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
                )}
              </div>

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
                          Классы
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Часы
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedTeacher.subjects.map((subject, idx) => (
                        <tr key={idx}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {subject.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex flex-wrap gap-1">
                              {subject.classes.map((cls, cIdx) => (
                                <span
                                  key={cIdx}
                                  className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs"
                                >
                                  {cls}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {subject.hours} ч.
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedTeacher.additionalActivities.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 border-b pb-2">Дополнительная нагрузка</h3>
                  <div className="space-y-3">
                    {selectedTeacher.additionalActivities.map((activity, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between">
                          <span className="font-medium">{activity.name}</span>
                          <span className="text-gray-700">{activity.hours} ч.</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Icon icon={FaCalendarAlt} className="text-blue-500 mr-2" />
                      <span className="text-sm text-gray-700">Отпуск</span>
                    </div>
                    <span className="font-semibold">{selectedTeacher.vacationDays} дней</span>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Icon icon={FaClock} className="text-yellow-500 mr-2" />
                      <span className="text-sm text-gray-700">Больничный</span>
                    </div>
                    <span className="font-semibold">{selectedTeacher.sickLeaveDays} дней</span>
                  </div>
                </div>
              </div>

              {/* Добавляем секцию ежедневного учета после графика */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Ежедневный учет часов</h3>
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center gap-2"
                    onClick={() => setShowDailyHours(true)}
                  >
                    + Добавить часы
                  </button>
                </div>

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
                            onChange={(e) => {
                              const type = e.target.value as WorkloadType;
                              setNewDailyRecord({
                                ...newDailyRecord,
                                type
                              });
                            }}
                          >
                            <option value="regular">Обычные часы</option>
                            <option value="overtime">Сверхурочные</option>
                            <option value="sick">Больничный</option>
                            <option value="vacation">Отпуск</option>
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
                          onClick={() => {
                            handleAddDailyHours();
                            setShowDailyHours(false);
                          }}
                        >
                          Добавить
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Таблица учета часов */}
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
                      {editedHours?.dailyHours?.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((record, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 whitespace-nowrap">
                            {new Date(record.date).toLocaleDateString('ru-RU')}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            {record.hours}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                              ${record.type === 'regular' ? 'bg-green-100 text-green-800' :
                                record.type === 'overtime' ? 'bg-blue-100 text-blue-800' :
                                  record.type === 'sick' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'}`}>
                              {record.type === 'regular' ? 'Обычные' :
                                record.type === 'overtime' ? 'Сверхурочные' :
                                  record.type === 'sick' ? 'Больничный' :
                                    'Отпуск'}
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
    </div>
  );
};

export default WorkloadPage;
