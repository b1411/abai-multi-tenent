import React, { useState, useMemo, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { performanceService } from '../services/performanceService';
import {
  PerformanceOverview,
  SubjectPerformance,
  StudentWithSubjects,
  StudentWithImprovements,
  ClassData,
  MonthlyData,
  GradeDistribution,
  PerformanceMetric,
  PerformanceFilter,
} from '../types/performance';
import { Spinner } from '../components/ui/Spinner';
import { useAuth } from '../hooks/useAuth';

const Performance: React.FC = () => {
  const { hasRole } = useAuth();
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State для данных
  const [overview, setOverview] = useState<PerformanceOverview | null>(null);
  const [subjects, setSubjects] = useState<SubjectPerformance[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [lowPerformingStudents, setLowPerformingStudents] = useState<StudentWithSubjects[]>([]);
  const [highProgressStudents, setHighProgressStudents] = useState<StudentWithImprovements[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [gradeDistribution, setGradeDistribution] = useState<GradeDistribution[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [allStudents, setAllStudents] = useState<{ id: number; name: string; surname: string; group: string; averageGrade: number; attendanceRate: number; assignmentRate: number }[]>([]);

  const filter: PerformanceFilter = useMemo(() =>
    selectedClass === 'all' ? {} : { groupId: selectedClass },
    [selectedClass]
  );

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        statisticsRes,
        subjectsRes,
        classesRes,
        lowStudentsRes,
        highStudentsRes,
        monthlyRes,
        distributionRes,
        metricsRes,
      ] = await Promise.all([
        performanceService.getStatistics(filter),
        performanceService.getSubjects(filter),
        performanceService.getClasses(filter),
        performanceService.getLowPerformingStudents(filter),
        performanceService.getHighProgressStudents(filter),
        performanceService.getMonthlyData(filter),
        performanceService.getGradeDistribution(filter),
        performanceService.getPerformanceMetrics(filter),
      ]);

      setOverview(statisticsRes.overview);
      setSubjects(subjectsRes.subjects);
      setClasses(classesRes.classes);
      setLowPerformingStudents(lowStudentsRes.students);
      setHighProgressStudents(highStudentsRes.students);
      setMonthlyData(monthlyRes);
      setGradeDistribution(distributionRes);
      setPerformanceMetrics(metricsRes);

      // Загружаем данные всех студентов только для админов и учителей
      if (hasRole('ADMIN') || hasRole('TEACHER')) {
        try {
          const allStudentsRes = await performanceService.getAllStudentsPerformance(filter);
          setAllStudents(allStudentsRes);
        } catch (err) {
          console.error('Error loading all students data:', err);
          setAllStudents([]);
        }
      }
    } catch (err) {
      setError('Ошибка загрузки данных');
      console.error('Error loading performance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filter]);

  // Проверяем, имеет ли пользователь доступ к странице
  if (!hasRole('ADMIN') && !hasRole('TEACHER') && !hasRole('PARENT') && !hasRole('STUDENT')) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-red-800 mb-2">Доступ запрещен</h3>
          <p className="text-red-600">
            У вас нет прав для просмотра этой страницы.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={loadData}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Селектор класса */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {hasRole('PARENT') 
                ? 'Успеваемость моих детей' 
                : hasRole('STUDENT')
                ? 'Моя успеваемость'
                : 'Успеваемость по группам'
              }
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {hasRole('PARENT')
                ? 'Отчеты и статистика успеваемости ваших детей'
                : hasRole('STUDENT')
                ? 'Ваша персональная статистика и достижения'
                : 'Анализ успеваемости студентов по группам'
              }
            </p>
          </div>
        </div>
        {(hasRole('ADMIN') || hasRole('TEACHER')) && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <button
              className={`px-4 py-2 rounded-md transition-all ${selectedClass === 'all'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              onClick={() => setSelectedClass('all')}
            >
              Все группы
            </button>
            {classes.map((cls) => (
              <button
                key={cls.id}
                className={`flex flex-col items-center justify-center px-6 py-4 rounded-lg transition-all ${selectedClass === cls.id
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border'
                  }`}
                onClick={() => setSelectedClass(cls.id)}
              >
                <span className="text-lg font-medium">{cls.name}</span>
                <div className="flex items-center gap-2 mt-2 text-sm opacity-80">
                  <span>{cls.studentsCount} учеников</span>
                  <span>•</span>
                  <span>{cls.averageGrade} ср.балл</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Верхние карточки */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <h3 className="text-sm text-gray-600 mb-2">Средний балл</h3>
            <div className="flex items-baseline justify-between">
              <div className="text-4xl font-semibold text-gray-900">
                {overview.averageGrade.toFixed(1)}
              </div>
              <div className={`flex items-center ${overview.trends.grade >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {overview.trends.grade >= 0 ? <FaArrowUp className="mr-1" /> : <FaArrowDown className="mr-1" />}
                <span className="text-sm">{overview.trends.grade >= 0 ? '+' : ''}{overview.trends.grade}</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <h3 className="text-sm text-gray-600 mb-2">Успеваемость</h3>
            <div className="flex items-baseline justify-between">
              <div className="text-4xl font-semibold text-gray-900">{overview.performanceRate}%</div>
              <div className={`flex items-center ${overview.trends.performance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {overview.trends.performance >= 0 ? <FaArrowUp className="mr-1" /> : <FaArrowDown className="mr-1" />}
                <span className="text-sm">{overview.trends.performance >= 0 ? '+' : ''}{overview.trends.performance}%</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <h3 className="text-sm text-gray-600 mb-2">Посещаемость</h3>
            <div className="flex items-baseline justify-between">
              <div className="text-4xl font-semibold text-gray-900">{overview.attendanceRate}%</div>
              <div className={`flex items-center ${overview.trends.attendance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {overview.trends.attendance >= 0 ? <FaArrowUp className="mr-1" /> : <FaArrowDown className="mr-1" />}
                <span className="text-sm">{overview.trends.attendance >= 0 ? '+' : ''}{overview.trends.attendance}%</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <h3 className="text-sm text-gray-600 mb-2">Выполнение заданий</h3>
            <div className="flex items-baseline justify-between">
              <div className="text-4xl font-semibold text-gray-900">{overview.assignmentCompletionRate}%</div>
              <div className={`flex items-center ${overview.trends.assignments >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {overview.trends.assignments >= 0 ? <FaArrowUp className="mr-1" /> : <FaArrowDown className="mr-1" />}
                <span className="text-sm">{overview.trends.assignments >= 0 ? '+' : ''}{overview.trends.assignments}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Основные графики */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border">
          <h3 className="text-sm text-gray-600 mb-4">Динамика успеваемости</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2E69FF" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#2E69FF" stopOpacity={0} />
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

        <div className="bg-white rounded-lg shadow-sm p-6 border">
          <h3 className="text-sm text-gray-600 mb-4">Распределение оценок</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gradeDistribution}
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {gradeDistribution.map((entry, index) => (
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
        <div className="bg-white rounded-lg shadow-sm p-6 border">
          <h3 className="text-sm text-gray-600 mb-4">Успеваемость по предметам</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjects} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 5]} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="grade" fill="#2E69FF" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border">
          <h3 className="text-sm text-gray-600 mb-4">Общие показатели</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={performanceMetrics}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar name="Показатели" dataKey="value" fill="#2E69FF" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Полный список студентов (только для админов и учителей) */}
      {(hasRole('ADMIN') || hasRole('TEACHER')) && (
        <div className="bg-white rounded-lg shadow-sm p-6 border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Все студенты по успеваемости</h3>
          <div className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Студент
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Группа
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Средний балл
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Посещаемость
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Выполнение заданий
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                        Нет данных о студентах
                      </td>
                    </tr>
                  ) : (
                    allStudents.map((student, index) => (
                      <tr
                        key={student.id}
                        className={`hover:bg-gray-50 cursor-pointer ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                        onClick={() => window.location.href = `/students/${student.id}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {student.name} {student.surname}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{student.group}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${student.averageGrade >= 4.5 ? 'text-green-600' :
                              student.averageGrade >= 3.5 ? 'text-yellow-600' :
                                student.averageGrade >= 3.0 ? 'text-orange-600' :
                                  'text-red-600'
                            }`}>
                            {student.averageGrade.toFixed(1)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm ${student.attendanceRate >= 90 ? 'text-green-600' :
                              student.attendanceRate >= 80 ? 'text-yellow-600' :
                                student.attendanceRate >= 70 ? 'text-orange-600' :
                                  'text-red-600'
                            }`}>
                            {student.attendanceRate}%
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm ${student.assignmentRate >= 90 ? 'text-green-600' :
                              student.assignmentRate >= 80 ? 'text-yellow-600' :
                                student.assignmentRate >= 70 ? 'text-orange-600' :
                                  'text-red-600'
                            }`}>
                            {student.assignmentRate}%
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Performance;
