import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle,
  Clock,
  Building,
  UserCheck
} from 'lucide-react';
import dashboardService, { AdminDashboardStats } from '../../services/dashboardService';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        setError(null);
        const adminData = await dashboardService.getAdminDashboard();
        setStats(adminData);
      } catch (error) {
        console.error('Error fetching admin dashboard data:', error);
        setError('Не удалось загрузить данные дэшборда');
        
        // Fallback to mock data if API fails
        setStats({
          totalStudents: 1247,
          totalTeachers: 85,
          totalGroups: 42,
          monthlyRevenue: 15780000,
          pendingApplications: 23,
          systemAlerts: 4,
          activeClassrooms: 18,
          completionRate: 94.5,
          financialSummary: {
            income: 15780000,
            expenses: 8450000,
            profit: 7330000
          },
          recentEvents: [
            {
              id: 1,
              type: 'new_teacher',
              title: 'Новый преподаватель',
              description: 'Иванов А.С. принят на должность учителя математики',
              timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
            },
            {
              id: 2,
              type: 'new_group',
              title: 'Группа сформирована',
              description: 'Создана новая группа "10Г класс" (25 студентов)',
              timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
            }
          ]
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
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
        <p className="text-gray-600">Административная панель</p>
      </div>

      {/* Основная статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Всего студентов</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalStudents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <GraduationCap className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Преподавателей</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalTeachers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Активных групп</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalGroups}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Доход за месяц</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.monthlyRevenue?.toLocaleString()} ₸</p>
            </div>
          </div>
        </div>
      </div>

      {/* Алерты и уведомления */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Требует внимания</h2>
          <div className="space-y-3">
            <div className="flex items-center p-3 bg-red-50 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Системные алерты</p>
                <p className="text-sm text-gray-600">{stats?.systemAlerts} критических уведомлений</p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-orange-50 rounded-lg">
              <Clock className="h-5 w-5 text-orange-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Заявления на рассмотрении</p>
                <p className="text-sm text-gray-600">{stats?.pendingApplications} новых заявлений</p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-blue-50 rounded-lg">
              <UserCheck className="h-5 w-5 text-blue-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Новые сотрудники</p>
                <p className="text-sm text-gray-600">3 заявления на трудоустройство</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Операционная статистика</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Завершенность курсов</span>
                <span className="font-medium">{stats?.completionRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${stats?.completionRate}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Использование кабинетов</span>
                <span className="font-medium">{stats?.activeClassrooms}/25</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${((stats?.activeClassrooms || 0) / 25) * 100}%` }}
                ></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Средняя посещаемость</span>
              <span className="text-lg font-bold text-green-600">89.2%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Быстрые действия</h2>
          <div className="space-y-3">
            <button className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
              <p className="font-medium text-blue-900">Добавить студента</p>
              <p className="text-sm text-blue-600">Зарегистрировать нового ученика</p>
            </button>
            <button className="w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
              <p className="font-medium text-green-900">Создать группу</p>
              <p className="text-sm text-green-600">Сформировать новую учебную группу</p>
            </button>
            <button className="w-full text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
              <p className="font-medium text-purple-900">Настроить расписание</p>
              <p className="text-sm text-purple-600">Управление учебным расписанием</p>
            </button>
          </div>
        </div>
      </div>

      {/* Детальная аналитика */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Финансовая сводка</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Поступления за месяц</p>
                <p className="text-lg font-bold text-green-600">{stats?.financialSummary?.income?.toLocaleString()} ₸</p>
              </div>
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Расходы за месяц</p>
                <p className="text-lg font-bold text-blue-600">{stats?.financialSummary?.expenses?.toLocaleString()} ₸</p>
              </div>
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Прибыль за месяц</p>
                <p className="text-lg font-bold text-purple-600">{stats?.financialSummary?.profit?.toLocaleString()} ₸</p>
              </div>
              <CheckCircle className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Последние события</h2>
          <div className="space-y-3">
            {stats?.recentEvents?.map((event) => (
              <div key={event.id} className="flex items-start p-3 bg-gray-50 rounded-lg">
                <div className={`p-1 rounded-full mr-3 mt-1 ${
                  event.type === 'new_teacher' ? 'bg-green-100' :
                  event.type === 'new_group' ? 'bg-blue-100' : 'bg-orange-100'
                }`}>
                  {event.type === 'new_teacher' && <CheckCircle className="h-4 w-4 text-green-600" />}
                  {event.type === 'new_group' && <Users className="h-4 w-4 text-blue-600" />}
                  {event.type === 'system_update' && <AlertCircle className="h-4 w-4 text-orange-600" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{event.title}</p>
                  <p className="text-xs text-gray-600">{event.description}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(event.timestamp).toLocaleString('ru-RU', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}
            {(!stats?.recentEvents || stats.recentEvents.length === 0) && (
              <p className="text-gray-500 text-center py-4">Нет недавних событий</p>
            )}
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

export default AdminDashboard;
