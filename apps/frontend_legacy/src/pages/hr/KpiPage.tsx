import React, { useState } from 'react';
import { 
  FaChartLine, 
  FaFilter, 
  FaSearch, 
  FaFileExport, 
  FaSortAmountDown, 
  FaArrowUp,
  FaArrowDown,
  FaMinus,
  FaRegClock
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
  Area
} from 'recharts';

// Типы данных
interface KpiCategory {
  id: string;
  name: string;
  description: string;
  weight: number;
}

interface KpiMetric {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  targetValue: number;
  weight: number;
}

interface EmployeeKpi {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  position: string;
  period: string;
  metrics: {
    metricId: string;
    actualValue: number;
    percentOfTarget: number;
    score: number;
    trend: 'up' | 'down' | 'stable';
  }[];
  totalScore: number;
  previousScore: number;
  scoreTrend: 'up' | 'down' | 'stable';
}

// Константы
const kpiCategories: KpiCategory[] = [
  {
    id: 'cat1',
    name: 'Академические результаты',
    description: 'Показатели академической успеваемости учеников',
    weight: 0.4
  },
  {
    id: 'cat2',
    name: 'Профессиональное развитие',
    description: 'Развитие профессиональных навыков и компетенций',
    weight: 0.2
  },
  {
    id: 'cat3',
    name: 'Внеклассная деятельность',
    description: 'Участие в мероприятиях и проектах за рамками основных уроков',
    weight: 0.15
  },
  {
    id: 'cat4',
    name: 'Работа с родителями',
    description: 'Коммуникация и взаимодействие с родителями учеников',
    weight: 0.15
  },
  {
    id: 'cat5',
    name: 'Документооборот',
    description: 'Своевременность и качество заполнения документации',
    weight: 0.1
  }
];

const kpiMetrics: KpiMetric[] = [
  {
    id: 'met1',
    categoryId: 'cat1',
    name: 'Средний балл учащихся',
    description: 'Средний балл учеников по предмету',
    targetValue: 4.5,
    weight: 0.3
  },
  {
    id: 'met2',
    categoryId: 'cat1',
    name: 'Успеваемость',
    description: 'Процент успевающих учеников',
    targetValue: 95,
    weight: 0.3
  },
  {
    id: 'met3',
    categoryId: 'cat1',
    name: 'Качество знаний',
    description: 'Процент учеников, успевающих на 4 и 5',
    targetValue: 70,
    weight: 0.4
  },
  {
    id: 'met4',
    categoryId: 'cat2',
    name: 'Курсы повышения квалификации',
    description: 'Количество пройденных курсов',
    targetValue: 2,
    weight: 0.5
  },
  {
    id: 'met5',
    categoryId: 'cat2',
    name: 'Участие в методических мероприятиях',
    description: 'Количество мероприятий',
    targetValue: 4,
    weight: 0.5
  },
  {
    id: 'met6',
    categoryId: 'cat3',
    name: 'Организация внеклассных мероприятий',
    description: 'Количество организованных мероприятий',
    targetValue: 3,
    weight: 0.6
  },
  {
    id: 'met7',
    categoryId: 'cat3',
    name: 'Руководство проектами',
    description: 'Количество проектов',
    targetValue: 2,
    weight: 0.4
  },
  {
    id: 'met8',
    categoryId: 'cat4',
    name: 'Родительские собрания',
    description: 'Количество проведенных собраний',
    targetValue: 4,
    weight: 0.4
  },
  {
    id: 'met9',
    categoryId: 'cat4',
    name: 'Индивидуальные консультации',
    description: 'Количество проведенных консультаций',
    targetValue: 20,
    weight: 0.6
  },
  {
    id: 'met10',
    categoryId: 'cat5',
    name: 'Своевременное заполнение журнала',
    description: 'Процент своевременного заполнения',
    targetValue: 100,
    weight: 0.7
  },
  {
    id: 'met11',
    categoryId: 'cat5',
    name: 'Качество отчетности',
    description: 'Оценка качества заполнения отчетов',
    targetValue: 5,
    weight: 0.3
  }
];

// Демо-данные для сотрудников
const initialEmployeesKpi: EmployeeKpi[] = [
  {
    id: 'emp_kpi_1',
    employeeId: '001',
    employeeName: 'Иванов Иван Иванович',
    department: 'Кафедра математики',
    position: 'Учитель математики',
    period: '2023-2024 (I полугодие)',
    metrics: [
      {
        metricId: 'met1',
        actualValue: 4.3,
        percentOfTarget: 96,
        score: 4.8,
        trend: 'up'
      },
      {
        metricId: 'met2',
        actualValue: 97,
        percentOfTarget: 102,
        score: 5.0,
        trend: 'stable'
      },
      {
        metricId: 'met3',
        actualValue: 65,
        percentOfTarget: 93,
        score: 4.6,
        trend: 'down'
      },
      {
        metricId: 'met4',
        actualValue: 2,
        percentOfTarget: 100,
        score: 5.0,
        trend: 'stable'
      },
      {
        metricId: 'met5',
        actualValue: 5,
        percentOfTarget: 125,
        score: 5.0,
        trend: 'up'
      },
      {
        metricId: 'met6',
        actualValue: 2,
        percentOfTarget: 67,
        score: 3.3,
        trend: 'down'
      },
      {
        metricId: 'met7',
        actualValue: 3,
        percentOfTarget: 150,
        score: 5.0,
        trend: 'up'
      },
      {
        metricId: 'met8',
        actualValue: 4,
        percentOfTarget: 100,
        score: 5.0,
        trend: 'stable'
      },
      {
        metricId: 'met9',
        actualValue: 18,
        percentOfTarget: 90,
        score: 4.5,
        trend: 'down'
      },
      {
        metricId: 'met10',
        actualValue: 100,
        percentOfTarget: 100,
        score: 5.0,
        trend: 'stable'
      },
      {
        metricId: 'met11',
        actualValue: 4.8,
        percentOfTarget: 96,
        score: 4.8,
        trend: 'up'
      }
    ],
    totalScore: 4.7,
    previousScore: 4.5,
    scoreTrend: 'up'
  },
  {
    id: 'emp_kpi_2',
    employeeId: '002',
    employeeName: 'Петрова Мария Сергеевна',
    department: 'Кафедра филологии',
    position: 'Учитель русского языка',
    period: '2023-2024 (I полугодие)',
    metrics: [
      {
        metricId: 'met1',
        actualValue: 4.6,
        percentOfTarget: 102,
        score: 5.0,
        trend: 'up'
      },
      {
        metricId: 'met2',
        actualValue: 100,
        percentOfTarget: 105,
        score: 5.0,
        trend: 'up'
      },
      {
        metricId: 'met3',
        actualValue: 75,
        percentOfTarget: 107,
        score: 5.0,
        trend: 'up'
      },
      {
        metricId: 'met4',
        actualValue: 1,
        percentOfTarget: 50,
        score: 2.5,
        trend: 'down'
      },
      {
        metricId: 'met5',
        actualValue: 3,
        percentOfTarget: 75,
        score: 3.8,
        trend: 'stable'
      },
      {
        metricId: 'met6',
        actualValue: 4,
        percentOfTarget: 133,
        score: 5.0,
        trend: 'up'
      },
      {
        metricId: 'met7',
        actualValue: 1,
        percentOfTarget: 50,
        score: 2.5,
        trend: 'down'
      },
      {
        metricId: 'met8',
        actualValue: 5,
        percentOfTarget: 125,
        score: 5.0,
        trend: 'up'
      },
      {
        metricId: 'met9',
        actualValue: 25,
        percentOfTarget: 125,
        score: 5.0,
        trend: 'up'
      },
      {
        metricId: 'met10',
        actualValue: 95,
        percentOfTarget: 95,
        score: 4.8,
        trend: 'down'
      },
      {
        metricId: 'met11',
        actualValue: 4.5,
        percentOfTarget: 90,
        score: 4.5,
        trend: 'stable'
      }
    ],
    totalScore: 4.5,
    previousScore: 4.4,
    scoreTrend: 'up'
  }
];

// Вспомогательные функции
const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
  switch (trend) {
    case 'up':
      return <FaArrowUp className="text-green-500" />;
    case 'down':
      return <FaArrowDown className="text-red-500" />;
    case 'stable':
      return <FaMinus className="text-gray-500" />;
  }
};

const getTrendClass = (trend: 'up' | 'down' | 'stable') => {
  switch (trend) {
    case 'up':
      return 'text-green-500';
    case 'down':
      return 'text-red-500';
    case 'stable':
      return 'text-gray-500';
  }
};

const getMetricById = (id: string) => {
  return kpiMetrics.find(metric => metric.id === id);
};

const getCategoryById = (id: string) => {
  return kpiCategories.find(category => category.id === id);
};

// Добавляем новую функцию для подготовки данных динамики
const prepareTrendData = (employeeData: EmployeeKpi) => {
  const currentMonth = new Date().getMonth();
  const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  
  // Получаем последние 4 месяца
  const lastMonths = Array.from({length: 4}, (_, i) => {
    const monthIndex = (currentMonth - (3 - i) + 12) % 12;
    return months[monthIndex];
  });

  // Генерируем значения с учетом тренда
  const startScore = employeeData.previousScore;
  const endScore = employeeData.totalScore;
  const step = (endScore - startScore) / 3;

  return lastMonths.map((month, index) => ({
    month,
    score: Number((startScore + step * index).toFixed(2)),
    previousScore: index > 0 ? Number((startScore + step * (index - 1)).toFixed(2)) : null
  }));
};

const KpiPage: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeKpi[]>(initialEmployeesKpi);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeKpi | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [periodFilter, setPeriodFilter] = useState('current');

  // Логика фильтрации
  const departments = [...new Set(employees.map(emp => emp.department))];
  
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          employee.position.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = selectedDepartment === null || employee.department === selectedDepartment;
    
    return matchesSearch && matchesDepartment;
  });

  // Обработчики событий
  const handleEmployeeClick = (employee: EmployeeKpi) => {
    setSelectedEmployee(employee);
    setIsModalOpen(true);
  };

  // Данные для графиков
  const prepareCategoryRadarData = (employeeData: EmployeeKpi) => {
    return kpiCategories.map(category => {
      const categoryMetrics = kpiMetrics.filter(metric => metric.categoryId === category.id);
      const employeeMetrics = employeeData.metrics.filter(m => 
        categoryMetrics.some(cm => cm.id === m.metricId)
      );
      
      const totalWeight = categoryMetrics.reduce((sum, metric) => sum + metric.weight, 0);
      const weightedScore = employeeMetrics.reduce((sum, metric) => {
        const metricDef = categoryMetrics.find(m => m.id === metric.metricId);
        return sum + (metric.score * (metricDef?.weight || 0));
      }, 0) / totalWeight;
      
      return {
        category: category.name,
        score: parseFloat(weightedScore.toFixed(2)) * 20 // Scale to 0-100
      };
    });
  };

  return (
    <div className="p-6">
      {/* Заголовок страницы */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">KPI и эффективность</h1>
          <p className="text-sm text-gray-500">Оценка эффективности и ключевые показатели деятельности персонала</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center">
            <FaChartLine className="mr-2" />
            Настроить KPI
          </button>
          <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md flex items-center">
            <FaFileExport className="mr-2" />
            Экспорт
          </button>
        </div>
      </div>

      {/* Фильтры */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4 items-center">
          <div className="relative">
            <input
              type="text"
              placeholder="Поиск сотрудника..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
          <div className="relative">
            <select
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-64 appearance-none"
              value={selectedDepartment || ''}
              onChange={(e) => setSelectedDepartment(e.target.value || null)}
            >
              <option value="">Все кафедры</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            <FaFilter className="absolute left-3 top-3 text-gray-400" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md appearance-none"
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
            >
              <option value="current">Текущий период</option>
              <option value="previous">Предыдущий период</option>
              <option value="year">Годовая статистика</option>
            </select>
            <FaRegClock className="absolute left-3 top-3 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Таблица KPI */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Сотрудник
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Кафедра
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Период
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Общий балл
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Тренд
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredEmployees.map((employee) => (
              <tr 
                key={employee.id} 
                className="hover:bg-gray-50 cursor-pointer" 
                onClick={() => handleEmployeeClick(employee)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{employee.employeeName}</div>
                  <div className="text-sm text-gray-500">{employee.position}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {employee.department}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {employee.period}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center 
                      ${employee.totalScore >= 4.5 ? 'bg-green-100 text-green-800' : 
                        employee.totalScore >= 3.5 ? 'bg-blue-100 text-blue-800' : 
                        employee.totalScore >= 2.5 ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'}`}>
                      <span className="font-semibold">{employee.totalScore.toFixed(1)}</span>
                    </div>
                    <div className="ml-4">
                      <div className="font-medium text-sm">
                        {employee.totalScore >= 4.5 ? 'Отлично' : 
                         employee.totalScore >= 3.5 ? 'Хорошо' : 
                         employee.totalScore >= 2.5 ? 'Удовлетворительно' : 
                         'Требует улучшения'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getTrendIcon(employee.scoreTrend)}
                    <span className={`ml-2 ${getTrendClass(employee.scoreTrend)}`}>
                      {(employee.totalScore - employee.previousScore).toFixed(1)}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Модальное окно с детальной информацией о KPI сотрудника */}
      {isModalOpen && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-5/6 max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedEmployee.employeeName}</h2>
                  <p className="text-gray-600">
                    {selectedEmployee.position} • {selectedEmployee.department}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Период: {selectedEmployee.period}
                  </p>
                </div>
                <div className="flex items-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mr-4
                    ${selectedEmployee.totalScore >= 4.5 ? 'bg-green-100 text-green-800' : 
                      selectedEmployee.totalScore >= 3.5 ? 'bg-blue-100 text-blue-800' : 
                      selectedEmployee.totalScore >= 2.5 ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'}`}>
                    <span className="font-bold text-2xl">{selectedEmployee.totalScore.toFixed(1)}</span>
                  </div>
                  <button 
                    className="text-gray-500 hover:text-gray-700"
                    onClick={() => setIsModalOpen(false)}
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* График по категориям */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold mb-4">Оценка по категориям</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={prepareCategoryRadarData(selectedEmployee)}>
                      <PolarGrid stroke="#E5E7EB" />
                      <PolarAngleAxis 
                        dataKey="category" 
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                        stroke="#E5E7EB"
                      />
                      <PolarRadiusAxis 
                        angle={30} 
                        domain={[0, 100]} 
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                        stroke="#E5E7EB"
                      />
                      <Radar
                        name="Баллы"
                        dataKey="score"
                        stroke="#8B5CF6"
                        fill="#8B5CF6"
                        fillOpacity={0.2}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                          padding: '12px'
                        }}
                        formatter={(value: number) => [`${value.toFixed(1)}%`, 'Показатель']}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* График динамики */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold mb-4">Динамика показателей</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={prepareTrendData(selectedEmployee)}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <defs>
                        <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis 
                        dataKey="month" 
                        stroke="#6B7280"
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                        axisLine={{ stroke: '#E5E7EB' }}
                      />
                      <YAxis 
                        domain={[0, 5]} 
                        stroke="#6B7280"
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                        axisLine={{ stroke: '#E5E7EB' }}
                        tickCount={6}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                          padding: '12px'
                        }}
                        formatter={(value: number) => [`${value.toFixed(1)}`, 'Общий балл']}
                      />
                      <Area
                        type="monotone"
                        dataKey="score"
                        stroke="#8B5CF6"
                        strokeWidth={2}
                        fill="url(#scoreGradient)"
                        dot={{ fill: '#8B5CF6', strokeWidth: 2 }}
                        activeDot={{ r: 6, fill: '#8B5CF6', stroke: 'white', strokeWidth: 2 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="previousScore"
                        stroke="#E5E7EB"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="flex items-center justify-center mt-4 text-sm text-gray-500">
                    <div className="flex items-center mr-4">
                      <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                      Текущий период
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-0.5 bg-gray-300 mr-2 border-dashed border-t-2"></div>
                      Предыдущий период
                    </div>
                  </div>
                </div>
              </div>

              {/* Таблица с метриками по категориям */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Детализация показателей</h3>
                
                {kpiCategories.map(category => {
                  const categoryMetrics = kpiMetrics.filter(
                    metric => metric.categoryId === category.id
                  );
                  
                  return (
                    <div key={category.id} className="mb-6">
                      <div className="flex items-center justify-between bg-gray-50 p-3 rounded-t-lg">
                        <h4 className="font-medium">{category.name}</h4>
                        <span className="text-sm text-gray-500">Вес: {category.weight * 100}%</span>
                      </div>
                      
                      <div className="overflow-hidden rounded-b-lg border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Показатель
                              </th>
                              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Целевое значение
                              </th>
                              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Факт
                              </th>
                              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                % выполнения
                              </th>
                              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Оценка
                              </th>
                              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Тренд
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {categoryMetrics.map(metric => {
                              const employeeMetric = selectedEmployee.metrics.find(
                                m => m.metricId === metric.id
                              );
                              
                              if (!employeeMetric) return null;
                              
                              return (
                                <tr key={metric.id}>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">
                                      {metric.name}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {metric.description}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                    {metric.targetValue}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                                    {employeeMetric.actualValue}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className={`text-sm font-medium 
                                      ${employeeMetric.percentOfTarget >= 100 
                                        ? 'text-green-600' 
                                        : employeeMetric.percentOfTarget >= 70 
                                          ? 'text-yellow-600' 
                                          : 'text-red-600'
                                      }`}>
                                      {employeeMetric.percentOfTarget}%
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                      <div 
                                        className={`h-1.5 rounded-full ${
                                          employeeMetric.percentOfTarget >= 100 
                                            ? 'bg-green-500' 
                                            : employeeMetric.percentOfTarget >= 70 
                                              ? 'bg-yellow-500' 
                                              : 'bg-red-500'
                                        }`} 
                                        style={{ width: `${Math.min(employeeMetric.percentOfTarget, 100)}%` }}>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                      ${employeeMetric.score >= 4.5 ? 'bg-green-100 text-green-800' : 
                                        employeeMetric.score >= 3.5 ? 'bg-blue-100 text-blue-800' : 
                                        employeeMetric.score >= 2.5 ? 'bg-yellow-100 text-yellow-800' : 
                                        'bg-red-100 text-red-800'}`}>
                                      {employeeMetric.score.toFixed(1)}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="flex items-center">
                                      {getTrendIcon(employeeMetric.trend)}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end pt-4 border-t">
                <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md mr-2">
                  Выгрузить отчет
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md">
                  Редактировать KPI
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KpiPage; 