import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { FaEllipsisH, FaArrowUp, FaArrowDown, FaChevronDown } from 'react-icons/fa';

interface Subject {
  name: string;
  grade: number;
  attendance: number;
  assignments: number;
  participation: number;
}

interface Student {
  name: string;
  grade: number;
  trend?: number;
}

interface ClassData {
  id: string;
  name: string;
  averageGrade: number;
  attendance: number;
  assignments: number;
  studentsCount: number;
}

const PerformancePage: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [isClassSelectorOpen, setIsClassSelectorOpen] = useState(false);

  const subjects: Subject[] = [
    { name: 'Математика', grade: 4.3, attendance: 95, assignments: 92, participation: 88 },
    { name: 'История', grade: 4.0, attendance: 88, assignments: 85, participation: 90 },
    { name: 'Биология', grade: 3.8, attendance: 92, assignments: 88, participation: 85 },
    { name: 'Английский', grade: 4.5, attendance: 94, assignments: 96, participation: 92 },
    { name: 'Физика', grade: 4.1, attendance: 90, assignments: 89, participation: 87 },
    { name: 'Химия', grade: 3.9, attendance: 91, assignments: 87, participation: 86 }
  ];

  const lowPerformingStudents: Student[] = [
    { name: 'Арман Сериков', grade: 2.8, trend: -0.2 },
    { name: 'Айдос Нурланов', grade: 3.1, trend: -0.1 },
    { name: 'Айгерим Жумабаева', grade: 3.3, trend: -0.3 }
  ];

  const highProgressStudents: Student[] = [
    { name: 'Бекзат Оспанов', grade: 4.8, trend: 0.5 },
    { name: 'Мадина Сатыбалды', grade: 4.7, trend: 0.4 },
    { name: 'Нурлан Алтынбеков', grade: 4.9, trend: 0.6 }
  ];

  const monthlyData = [
    { month: 'Сен', value: 3.8, attendance: 88, assignments: 85 },
    { month: 'Окт', value: 3.9, attendance: 90, assignments: 87 },
    { month: 'Ноя', value: 4.0, attendance: 92, assignments: 89 },
    { month: 'Дек', value: 4.1, attendance: 91, assignments: 90 },
    { month: 'Янв', value: 4.2, attendance: 93, assignments: 92 },
    { month: 'Фев', value: 4.3, attendance: 94, assignments: 93 }
  ];

  const gradeDistribution = [
    { name: '5', value: 25, color: '#10B981' },
    { name: '4', value: 40, color: '#3B82F6' },
    { name: '3', value: 25, color: '#F59E0B' },
    { name: '2', value: 10, color: '#EF4444' }
  ];

  const performanceMetrics = [
    { subject: 'Оценки', value: 85 },
    { subject: 'Посещаемость', value: 92 },
    { subject: 'Домашние задания', value: 88 },
    { subject: 'Активность', value: 78 },
    { subject: 'Тесты', value: 82 }
  ];

  const classes: ClassData[] = [
    { id: '10a', name: 'МК24-1М', averageGrade: 4.2, attendance: 92, assignments: 85, studentsCount: 25 },
    { id: '10b', name: 'МК24-2М', averageGrade: 4.0, attendance: 88, assignments: 82, studentsCount: 23 },
    { id: '11a', name: 'ПК24-1П', averageGrade: 4.3, attendance: 94, assignments: 88, studentsCount: 24 },
    { id: '11b', name: 'ПР24-1Ю', averageGrade: 3.9, attendance: 90, assignments: 84, studentsCount: 22 },
  ];

  const filteredData = useMemo(() => {
    if (selectedClass === 'all') return {
      subjects,
      lowPerformingStudents,
      highProgressStudents,
      monthlyData,
      gradeDistribution,
      performanceMetrics
    };

    // Здесь будет логика фильтрации данных по выбранному классу
    // Для примера просто модифицируем существующие данные
    const classMultiplier = selectedClass.includes('a') ? 1.1 : 0.9;
    
    return {
      subjects: subjects.map(s => ({ ...s, grade: +(s.grade * classMultiplier).toFixed(1) })),
      lowPerformingStudents,
      highProgressStudents,
      monthlyData: monthlyData.map(m => ({ ...m, value: +(m.value * classMultiplier).toFixed(1) })),
      gradeDistribution,
      performanceMetrics: performanceMetrics.map(m => ({ ...m, value: Math.min(100, Math.round(m.value * classMultiplier)) }))
    };
  }, [selectedClass]);

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Селектор класса */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Успеваемость по группам</h1>
        </div>
        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <button className="px-4 py-2 bg-blue-500 text-white rounded-md">
              Все группы
            </button>
            {classes.map((cls) => (
              <button
                key={cls.id}
                className={`flex flex-col items-center justify-center px-6 py-4 rounded-lg transition-all
                  ${selectedClass === cls.id 
                    ? 'bg-blue-500 text-white shadow-lg' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                onClick={() => setSelectedClass(cls.id)}
              >
                <span className="text-lg font-medium">{cls.name}</span>
                <div className="flex items-center gap-2 mt-2 text-sm opacity-80">
                  <span>{cls.studentsCount} учеников</span>
                  <span>•</span>
                  <span>{cls.averageGrade.toFixed(1)} ср.балл</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Верхние карточки */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-sm text-gray-600 mb-2">Средний балл</h3>
          <div className="flex items-baseline justify-between">
            <div className="text-4xl font-semibold text-gray-900">
              {selectedClass === 'all' 
                ? '4,2' 
                : classes.find(c => c.id === selectedClass)?.averageGrade.toFixed(1)}
            </div>
            <div className="flex items-center text-green-500">
              <FaArrowUp className="mr-1" />
              <span className="text-sm">+0.3</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-sm text-gray-600 mb-2">Успеваемость</h3>
          <div className="flex items-baseline justify-between">
            <div className="text-4xl font-semibold text-gray-900">78%</div>
            <div className="flex items-center text-green-500">
              <FaArrowUp className="mr-1" />
              <span className="text-sm">+5%</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-sm text-gray-600 mb-2">Посещаемость</h3>
          <div className="flex items-baseline justify-between">
            <div className="text-4xl font-semibold text-gray-900">92%</div>
            <div className="flex items-center text-red-500">
              <FaArrowDown className="mr-1" />
              <span className="text-sm">-2%</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-sm text-gray-600 mb-2">Выполнение заданий</h3>
          <div className="flex items-baseline justify-between">
            <div className="text-4xl font-semibold text-gray-900">85%</div>
            <div className="flex items-center text-green-500">
              <FaArrowUp className="mr-1" />
              <span className="text-sm">+3%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Основные графики */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-sm text-gray-600 mb-4">Динамика успеваемости</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredData.monthlyData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2E69FF" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2E69FF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis domain={[2, 5]} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#2E69FF" fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-sm text-gray-600 mb-4">Распределение оценок</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={filteredData.gradeDistribution}
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {filteredData.gradeDistribution.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Успеваемость по предметам и радар */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-sm text-gray-600 mb-4">Успеваемость по предметам</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredData.subjects} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 5]} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="grade" fill="#2E69FF" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-sm text-gray-600 mb-4">Общие показатели</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={filteredData.performanceMetrics}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar name="Показатели" dataKey="value" fill="#2E69FF" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Списки студентов */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-sm text-gray-600 mb-4">Студенты с низкой успеваемостью</h3>
          <div className="space-y-3">
            {filteredData.lowPerformingStudents.map((student, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <span className="text-sm text-gray-900">{student.name}</span>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-red-500 mr-2">{student.grade.toFixed(1)}</span>
                  <span className="text-xs text-red-600">({student.trend?.toFixed(1)})</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-sm text-gray-600 mb-4">Студенты с высоким прогрессом</h3>
          <div className="space-y-3">
            {filteredData.highProgressStudents.map((student, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-sm text-gray-900">{student.name}</span>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-green-500 mr-2">{student.grade.toFixed(1)}</span>
                  <span className="text-xs text-green-600">(+{student.trend?.toFixed(1)})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformancePage; 