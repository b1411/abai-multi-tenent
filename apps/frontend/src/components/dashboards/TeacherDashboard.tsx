import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Book, Calendar, Users, CheckCircle, Clock, AlertTriangle, GraduationCap, FileText } from 'lucide-react';
import dashboardService, { TeacherDashboardStats } from '../../services/dashboardService';

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<TeacherDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        setLoading(true);
        setError(null);
        const teacherData = await dashboardService.getTeacherDashboard();
        setStats(teacherData);
      } catch (error) {
        console.error('Error fetching teacher dashboard data:', error);
        setError('Не удалось загрузить данные дэшборда');
        
        // Fallback to mock data if API fails
        setStats({
          todayLessons: 4,
          totalStudents: 125,
          pendingGrading: 18,
          upcomingDeadlines: 3,
          completedLessons: 87,
          monthlyWorkload: 156,
          todaySchedule: [
            { id: 1, subject: 'Математика', group: 'Группа 10А', time: '09:00 - 10:30', classroom: 'Кабинет 201', status: 'current' },
            { id: 2, subject: 'Алгебра', group: 'Группа 11Б', time: '11:00 - 12:30', classroom: 'Кабинет 201', status: 'upcoming' },
            { id: 3, subject: 'Геометрия', group: 'Группа 9В', time: '14:00 - 15:30', classroom: 'Кабинет 201', status: 'upcoming' }
          ],
          alerts: [
            { id: 1, type: 'homework', title: 'Домашние задания', description: '18 работ нужно проверить до завтра', priority: 'high' },
            { id: 2, type: 'report', title: 'Отчет по успеваемости', description: 'Срок сдачи: через 2 дня', priority: 'medium' },
            { id: 3, type: 'lesson_plan', title: 'Планы уроков', description: 'Подготовить на следующую неделю', priority: 'low' }
          ],
          groupPerformance: [
            { groupName: '10А класс', studentCount: 28, averageGrade: 4.3 },
            { groupName: '11Б класс', studentCount: 25, averageGrade: 4.1 },
            { groupName: '9В класс', studentCount: 30, averageGrade: 3.8 }
          ]
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Добро пожаловать, {user?.name} {user?.surname}
        </h1>
        <p className="text-gray-600">Панель преподавателя</p>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Уроки сегодня</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.todayLessons}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Всего студентов</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalStudents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <FileText className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Нужно проверить</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.pendingGrading}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <Clock className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Срочные дедлайны</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.upcomingDeadlines}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Основная информация */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Расписание на сегодня</h2>
          <div className="space-y-3">
            {stats?.todaySchedule.map((lesson) => (
              <div key={lesson.id} className={`flex items-center justify-between p-3 rounded-lg ${
                lesson.status === 'current' ? 'bg-blue-50' : 'bg-gray-50'
              }`}>
                <div className="flex items-center">
                  <GraduationCap className={`h-5 w-5 mr-3 ${
                    lesson.status === 'current' ? 'text-blue-600' : 'text-gray-600'
                  }`} />
                  <div>
                    <p className="font-medium text-gray-900">{lesson.subject} - {lesson.group}</p>
                    <p className="text-sm text-gray-600">{lesson.time}, {lesson.classroom}</p>
                  </div>
                </div>
                {lesson.status === 'current' && (
                  <span className="text-blue-600 text-sm font-medium">Сейчас</span>
                )}
                {lesson.status === 'upcoming' && (
                  <span className="text-gray-600 text-sm font-medium">Следующий</span>
                )}
              </div>
            ))}
            {(!stats?.todaySchedule || stats.todaySchedule.length === 0) && (
              <p className="text-gray-500 text-center py-4">Сегодня уроков нет</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Требует внимания</h2>
          <div className="space-y-3">
            {stats?.alerts.map((alert) => (
              <div key={alert.id} className={`flex items-center p-3 rounded-lg ${
                alert.priority === 'high' ? 'bg-red-50' :
                alert.priority === 'medium' ? 'bg-yellow-50' : 'bg-orange-50'
              }`}>
                {alert.type === 'homework' && <AlertTriangle className={`h-5 w-5 mr-3 ${
                  alert.priority === 'high' ? 'text-red-600' :
                  alert.priority === 'medium' ? 'text-yellow-600' : 'text-orange-600'
                }`} />}
                {alert.type === 'report' && <Clock className={`h-5 w-5 mr-3 ${
                  alert.priority === 'high' ? 'text-red-600' :
                  alert.priority === 'medium' ? 'text-yellow-600' : 'text-orange-600'
                }`} />}
                {alert.type === 'lesson_plan' && <FileText className={`h-5 w-5 mr-3 ${
                  alert.priority === 'high' ? 'text-red-600' :
                  alert.priority === 'medium' ? 'text-yellow-600' : 'text-orange-600'
                }`} />}
                <div>
                  <p className="font-medium text-gray-900">{alert.title}</p>
                  <p className="text-sm text-gray-600">{alert.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Статистика работы */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Рабочая нагрузка</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Проведено уроков в месяце</span>
                <span className="font-medium">{stats?.completedLessons}/100</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${(stats?.completedLessons || 0)}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Часы за месяц</span>
                <span className="font-medium">{stats?.monthlyWorkload}/180</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${((stats?.monthlyWorkload || 0) / 180) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Группы</h3>
          <div className="space-y-3">
            {stats?.groupPerformance.map((group, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-gray-600">{group.groupName}</span>
                <span className={`text-sm px-2 py-1 rounded ${
                  index === 0 ? 'bg-green-100 text-green-800' :
                  index === 1 ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                }`}>
                  {group.studentCount} студентов
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Успеваемость групп</h3>
          <div className="space-y-3">
            {stats?.groupPerformance.map((group, index) => (
              <div key={index} className={`text-center p-3 rounded-lg ${
                group.averageGrade >= 4.2 ? 'bg-green-50' :
                group.averageGrade >= 4.0 ? 'bg-blue-50' : 'bg-yellow-50'
              }`}>
                <p className="text-sm text-gray-600">{group.groupName}</p>
                <p className={`text-xl font-bold ${
                  group.averageGrade >= 4.2 ? 'text-green-600' :
                  group.averageGrade >= 4.0 ? 'text-blue-600' : 'text-yellow-600'
                }`}>
                  {group.averageGrade}
                </p>
                <p className="text-xs text-gray-500">Средний балл</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">{error}</p>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
