import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  Users, 
  UserPlus, 
  Calendar, 
  Clock, 
  FileText, 
  AlertTriangle,
  TrendingUp,
  Award,
  UserCheck,
  MessageSquare
} from 'lucide-react';
import dashboardService, { HRDashboardStats } from '../../services/dashboardService';

const HRDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<HRDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHRData = async () => {
      try {
        setLoading(true);
        setError(null);
        const hrData = await dashboardService.getHRDashboard();
        setStats(hrData);
      } catch (error) {
        console.error('Error fetching HR dashboard data:', error);
        setError('Не удалось загрузить данные дэшборда');
      } finally {
        setLoading(false);
      }
    };

    fetchHRData();
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
        <p className="text-gray-600">HR панель управления</p>
      </div>

      {/* Основная статистика по персоналу */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Всего сотрудников</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalEmployees}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Активные преподаватели</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.activeTeachers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <UserPlus className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Заявки на работу</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.pendingApplications}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">В отпуске</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.onVacation}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Отпуска и больничные */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Статус сотрудников</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Работают</span>
              <div className="flex items-center">
                <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${((stats?.totalEmployees || 0) - (stats?.onVacation || 0) - (stats?.sickLeave || 0)) / (stats?.totalEmployees || 1) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{(stats?.totalEmployees || 0) - (stats?.onVacation || 0) - (stats?.sickLeave || 0)}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">В отпуске</span>
              <div className="flex items-center">
                <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${((stats?.onVacation || 0) / (stats?.totalEmployees || 1)) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{stats?.onVacation}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">На больничном</span>
              <div className="flex items-center">
                <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                  <div 
                    className="bg-red-600 h-2 rounded-full" 
                    style={{ width: `${((stats?.sickLeave || 0) / (stats?.totalEmployees || 1)) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{stats?.sickLeave}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Требует внимания</h2>
          <div className="space-y-3">
            <div className="flex items-center p-3 bg-orange-50 rounded-lg">
              <Clock className="h-5 w-5 text-orange-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Заявки на отпуск</p>
                <p className="text-sm text-gray-600">{stats?.pendingTimeoffs} на рассмотрении</p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-yellow-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Истекающие контракты</p>
                <p className="text-sm text-gray-600">{stats?.contractsExpiring} в этом месяце</p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-purple-50 rounded-lg">
              <Award className="h-5 w-5 text-purple-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Дни рождения</p>
                <p className="text-sm text-gray-600">{stats?.upcomingBirthdays} на этой неделе</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">HR метрики</h2>
          <div className="space-y-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Средняя зарплата</p>
              <p className="text-xl font-bold text-green-600">{stats?.averageSalary?.toLocaleString()} ₸</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Текучесть кадров</p>
              <p className="text-xl font-bold text-blue-600">{stats?.turnoverRate}%</p>
              <p className="text-xs text-gray-500">За год</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">Удовлетворенность</p>
              <p className="text-xl font-bold text-purple-600">4.2/5</p>
              <p className="text-xs text-gray-500">По опросам</p>
            </div>
          </div>
        </div>
      </div>

      {/* Заявки на отпуск */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Заявки на отпуск</h2>
        <div className="space-y-3">
          {stats?.vacationRequests?.map((request) => (
            <div key={request.id} className={`flex items-center justify-between p-3 rounded-lg ${
              request.status === 'pending' ? 'bg-blue-50' :
              request.status === 'approved' ? 'bg-green-50' :
              request.status === 'rejected' ? 'bg-red-50' : 'bg-yellow-50'
            }`}>
              <div>
                <p className="font-medium text-gray-900">
                  {request.type === 'vacation' ? 'Отпуск' :
                   request.type === 'sick' ? 'Больничный' :
                   request.type === 'business_trip' ? 'Командировка' : 'Отгул'}
                </p>
                <p className="text-sm text-gray-600">{request.employeeName} • {request.dates} ({request.duration})</p>
              </div>
              <div className="text-right">
                <span className={`text-sm font-medium ${
                  request.status === 'pending' ? 'text-blue-600' :
                  request.status === 'approved' ? 'text-green-600' :
                  request.status === 'rejected' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {request.status === 'pending' ? 'Ожидает' :
                   request.status === 'approved' ? 'Одобрено' :
                   request.status === 'rejected' ? 'Отклонено' : 'На согласовании'}
                </span>
                <p className="text-xs text-gray-500">
                  {new Date(request.submittedAt).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'short'
                  })}
                </p>
              </div>
            </div>
          ))}
          {(!stats?.vacationRequests || stats.vacationRequests.length === 0) && (
            <p className="text-gray-500 text-center py-4">Нет заявок на отпуск</p>
          )}
        </div>
      </div>

      {/* Аналитика и события */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Аналитика по отделам</h2>
          <div className="space-y-4">
            {stats?.departmentAnalytics?.map((department, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{department.department}</p>
                  <p className="text-sm text-gray-600">{department.employeeCount} сотрудников</p>
                </div>
                <div className="text-right">
                  <span className={`text-lg font-bold ${
                    index === 0 ? 'text-blue-600' :
                    index === 1 ? 'text-green-600' :
                    index === 2 ? 'text-purple-600' : 'text-gray-600'
                  }`}>
                    {department.percentage}%
                  </span>
                  <p className="text-xs text-gray-500">от общего числа</p>
                </div>
              </div>
            ))}
            {(!stats?.departmentAnalytics || stats.departmentAnalytics.length === 0) && (
              <p className="text-gray-500 text-center py-4">Нет данных об отделах</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Предстоящие события</h2>
          <div className="space-y-3">
            {stats?.upcomingEvents?.map((event) => (
              <div key={event.id} className={`flex items-start p-3 rounded-lg ${
                event.type === 'birthday' ? 'bg-green-50' :
                event.type === 'interview' ? 'bg-blue-50' :
                event.type === 'contract_expiry' ? 'bg-orange-50' : 'bg-purple-50'
              }`}>
                <div className={`p-1 rounded-full mr-3 mt-1 ${
                  event.type === 'birthday' ? 'bg-green-100' :
                  event.type === 'interview' ? 'bg-blue-100' :
                  event.type === 'contract_expiry' ? 'bg-orange-100' : 'bg-purple-100'
                }`}>
                  {event.type === 'birthday' && <Award className="h-4 w-4 text-green-600" />}
                  {event.type === 'interview' && <Calendar className="h-4 w-4 text-blue-600" />}
                  {event.type === 'contract_expiry' && <FileText className="h-4 w-4 text-orange-600" />}
                  {event.type === 'evaluation' && <MessageSquare className="h-4 w-4 text-purple-600" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{event.title}</p>
                  <p className="text-xs text-gray-600">{event.description}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(event.date).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'short',
                      hour: event.date.includes('T') ? '2-digit' : undefined,
                      minute: event.date.includes('T') ? '2-digit' : undefined
                    })}
                  </p>
                </div>
              </div>
            ))}
            {(!stats?.upcomingEvents || stats.upcomingEvents.length === 0) && (
              <p className="text-gray-500 text-center py-4">Нет предстоящих событий</p>
            )}
          </div>
        </div>
      </div>

      {/* Быстрые действия */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Быстрые действия</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-center">
            <UserPlus className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="font-medium text-blue-900">Добавить сотрудника</p>
            <p className="text-sm text-blue-600">Новый сотрудник в систему</p>
          </button>
          <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-center">
            <Calendar className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="font-medium text-green-900">Управление отпусками</p>
            <p className="text-sm text-green-600">Заявки и расписание</p>
          </button>
          <button className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors text-center">
            <FileText className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <p className="font-medium text-orange-900">Документооборот</p>
            <p className="text-sm text-orange-600">Контракты и приказы</p>
          </button>
          <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-center">
            <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="font-medium text-purple-900">HR отчеты</p>
            <p className="text-sm text-purple-600">Аналитика и статистика</p>
          </button>
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

export default HRDashboard;
