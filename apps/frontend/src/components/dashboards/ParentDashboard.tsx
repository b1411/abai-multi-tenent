import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  User, 
  Calendar, 
  BookOpen, 
  Star, 
  TrendingUp, 
  AlertTriangle, 
  MessageCircle,
  Clock,
  CheckCircle,
  FileText
} from 'lucide-react';
import dashboardService, { ParentDashboardStats } from '../../services/dashboardService';

const ParentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<ParentDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchParentData = async () => {
      try {
        setLoading(true);
        setError(null);
        const parentData = await dashboardService.getParentDashboard();
        setStats(parentData);
      } catch (error) {
        console.error('Error fetching parent dashboard data:', error);
        setError('Не удалось загрузить данные дэшборда');
      } finally {
        setLoading(false);
      }
    };

    fetchParentData();
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
        <p className="text-gray-600">Родительская панель</p>
      </div>

      {/* Общая статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Детей в школе</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.children.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <FileText className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">К доплате</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalPayments?.toLocaleString()} ₸</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Просроченные платежи</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.overduePayments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <MessageCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Новые сообщения</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.unreadMessages}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Информация о детях */}
      <div className="space-y-6">
        {stats?.children.map((child) => (
          <div key={child.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {child.name} {child.surname} - {child.grade} класс
              </h2>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                Активный студент
              </span>
            </div>

            {/* Статистика по ребенку */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Star className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600">{child.averageGrade}</p>
                <p className="text-sm text-gray-600">Средний балл</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-600">{child.attendance}%</p>
                <p className="text-sm text-gray-600">Посещаемость</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Calendar className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-600">{child.upcomingLessons}</p>
                <p className="text-sm text-gray-600">Уроков на неделе</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <BookOpen className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-orange-600">{child.pendingHomework}</p>
                <p className="text-sm text-gray-600">Д/З к выполнению</p>
              </div>
            </div>

            {/* Расписание и домашние задания */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Расписание на завтра</h3>
                <div className="space-y-2">
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <Clock className="h-5 w-5 text-gray-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Математика</p>
                      <p className="text-sm text-gray-600">09:00 - 10:30, Кабинет 201</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <Clock className="h-5 w-5 text-gray-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Физика</p>
                      <p className="text-sm text-gray-600">11:00 - 12:30, Кабинет 305</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Домашние задания</h3>
                <div className="space-y-2">
                  {child.pendingHomework > 0 ? (
                    <>
                      <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">Решение уравнений</p>
                          <p className="text-sm text-gray-600">Математика • Срок: завтра</p>
                        </div>
                        <span className="text-yellow-600 text-sm font-medium">В процессе</span>
                      </div>
                      {child.pendingHomework > 1 && (
                        <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">Лабораторная работа</p>
                            <p className="text-sm text-gray-600">Физика • Срок: вчера</p>
                          </div>
                          <span className="text-red-600 text-sm font-medium">Просрочено</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                      <p className="text-gray-600">Все задания выполнены</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Финансовая информация и уведомления */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Платежи и счета</h2>
          <div className="space-y-3">
            {stats?.payments?.map((payment) => (
              <div key={payment.id} className={`flex items-center justify-between p-3 rounded-lg ${
                payment.status === 'paid' ? 'bg-green-50' :
                payment.status === 'pending' ? 'bg-yellow-50' : 'bg-red-50'
              }`}>
                <div>
                  <p className="font-medium text-gray-900">{payment.title}</p>
                  <p className="text-sm text-gray-600">{payment.description}</p>
                </div>
                <span className={`text-sm font-medium ${
                  payment.status === 'paid' ? 'text-green-600' :
                  payment.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {payment.status === 'paid' ? 'Оплачено' :
                   payment.status === 'pending' ? 'К оплате' : 'Просрочено'}
                </span>
              </div>
            ))}
            {(!stats?.payments || stats.payments.length === 0) && (
              <p className="text-gray-500 text-center py-4">Нет активных платежей</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Последние уведомления</h2>
          <div className="space-y-3">
            {stats?.notifications?.map((notification) => (
              <div key={notification.id} className={`flex items-start p-3 rounded-lg ${
                notification.type === 'message' ? 'bg-blue-50' :
                notification.type === 'payment' ? 'bg-yellow-50' : 'bg-green-50'
              }`}>
                <div className={`p-1 rounded-full mr-3 mt-1 ${
                  notification.type === 'message' ? 'bg-blue-100' :
                  notification.type === 'payment' ? 'bg-yellow-100' : 'bg-green-100'
                }`}>
                  {notification.type === 'message' && <MessageCircle className="h-4 w-4 text-blue-600" />}
                  {notification.type === 'payment' && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                  {notification.type === 'grade' && <CheckCircle className="h-4 w-4 text-green-600" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                  <p className="text-xs text-gray-600">{notification.description}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(notification.timestamp).toLocaleString('ru-RU', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}
            {(!stats?.notifications || stats.notifications.length === 0) && (
              <p className="text-gray-500 text-center py-4">Нет новых уведомлений</p>
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

export default ParentDashboard;
