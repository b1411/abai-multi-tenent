import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  FileText, 
  AlertTriangle,
  Calendar,
  PieChart,
  BarChart3,
  Target,
  Download
} from 'lucide-react';
import dashboardService, { FinancistDashboardStats } from '../../services/dashboardService';
import InvoiceGenerator from '../InvoiceGenerator';

const FinancistDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<FinancistDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInvoiceGenerator, setShowInvoiceGenerator] = useState(false);

  useEffect(() => {
    const fetchFinancistData = async () => {
      try {
        setLoading(true);
        setError(null);
        const financistData = await dashboardService.getFinancistDashboard();
        setStats(financistData);
      } catch (error) {
        console.error('Error fetching financist dashboard data:', error);
        setError('Не удалось загрузить данные дэшборда');
      } finally {
        setLoading(false);
      }
    };

    fetchFinancistData();
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
        <p className="text-gray-600">Финансовая панель</p>
      </div>

      {/* Основные финансовые показатели */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Доходы за месяц</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.monthlyRevenue?.toLocaleString()} ₸</p>
              <div className="flex items-center mt-1">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+{stats?.revenueGrowth}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Расходы за месяц</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.monthlyExpenses?.toLocaleString()} ₸</p>
              <div className="flex items-center mt-1">
                <TrendingUp className="h-4 w-4 text-red-500 mr-1" />
                <span className="text-sm text-red-600">+{stats?.expenseGrowth}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Прибыль за месяц</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.profit?.toLocaleString()} ₸</p>
              <div className="flex items-center mt-1">
                <span className="text-sm text-blue-600">
                  {((stats?.profit || 0) / (stats?.monthlyRevenue || 1) * 100).toFixed(1)}% маржа
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <CreditCard className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Задолженности</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.outstandingPayments?.toLocaleString()} ₸</p>
              <div className="flex items-center mt-1">
                <AlertTriangle className="h-4 w-4 text-orange-500 mr-1" />
                <span className="text-sm text-orange-600">{stats?.overduePayments?.toLocaleString()} ₸ просрочено</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Детальная аналитика */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Структура доходов</h2>
          <div className="space-y-4">
            {stats?.revenueStructure?.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-gray-600">{item.category}</span>
                <div className="flex items-center">
                  <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                    <div 
                      className={`h-2 rounded-full ${
                        index === 0 ? 'bg-blue-600' :
                        index === 1 ? 'bg-green-600' :
                        index === 2 ? 'bg-yellow-600' : 'bg-purple-600'
                      }`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{item.percentage}%</span>
                </div>
              </div>
            ))}
            {(!stats?.revenueStructure || stats.revenueStructure.length === 0) && (
              <p className="text-gray-500 text-center py-4">Нет данных о структуре доходов</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Структура расходов</h2>
          <div className="space-y-4">
            {stats?.expenseStructure?.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-gray-600">{item.category}</span>
                <div className="flex items-center">
                  <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                    <div 
                      className={`h-2 rounded-full ${
                        index === 0 ? 'bg-red-600' :
                        index === 1 ? 'bg-orange-600' :
                        index === 2 ? 'bg-purple-600' : 'bg-gray-600'
                      }`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{item.percentage}%</span>
                </div>
              </div>
            ))}
            {(!stats?.expenseStructure || stats.expenseStructure.length === 0) && (
              <p className="text-gray-500 text-center py-4">Нет данных о структуре расходов</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Требует внимания</h2>
          <div className="space-y-3">
            <div className="flex items-center p-3 bg-red-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Просроченные платежи</p>
                <p className="text-sm text-gray-600">{stats?.overduePayments?.toLocaleString()} ₸</p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-orange-50 rounded-lg">
              <FileText className="h-5 w-5 text-orange-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Заявки на бюджет</p>
                <p className="text-sm text-gray-600">{stats?.pendingBudgetRequests} на рассмотрении</p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-blue-50 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Отчет за квартал</p>
                <p className="text-sm text-gray-600">Требует подготовки</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Платежи и бюджет */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Последние транзакции</h2>
          <div className="space-y-3">
            {stats?.recentTransactions?.map((transaction) => (
              <div key={transaction.id} className={`flex items-center justify-between p-3 rounded-lg ${
                transaction.type === 'income' ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <div className="flex items-center">
                  <div className={`p-1 rounded-full mr-3 ${
                    transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {transaction.type === 'income' ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{transaction.title}</p>
                    <p className="text-sm text-gray-600">{transaction.description}</p>
                  </div>
                </div>
                <span className={`font-medium ${
                  transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.type === 'income' ? '+' : '-'}{transaction.amount.toLocaleString()} ₸
                </span>
              </div>
            ))}
            {(!stats?.recentTransactions || stats.recentTransactions.length === 0) && (
              <p className="text-gray-500 text-center py-4">Нет последних транзакций</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Бюджетные заявки</h2>
          <div className="space-y-3">
            {stats?.budgetRequests?.map((request) => (
              <div key={request.id} className={`flex items-center justify-between p-3 rounded-lg ${
                request.status === 'pending' ? 'bg-yellow-50' :
                request.status === 'approved' ? 'bg-green-50' : 'bg-blue-50'
              }`}>
                <div>
                  <p className="font-medium text-gray-900">{request.title}</p>
                  <p className="text-sm text-gray-600">{request.description} • {request.priority === 'high' ? 'Срочно' : request.priority === 'medium' ? 'Плановый' : 'Обычный'}</p>
                </div>
                <div className="text-right">
                  <span className={`font-medium ${
                    request.status === 'pending' ? 'text-yellow-600' :
                    request.status === 'approved' ? 'text-green-600' : 'text-blue-600'
                  }`}>
                    {request.amount.toLocaleString()} ₸
                  </span>
                  <p className="text-xs text-gray-500">
                    {request.status === 'pending' ? 'На рассмотрении' :
                     request.status === 'approved' ? 'Одобрено' : 'В обработке'}
                  </p>
                </div>
              </div>
            ))}
            {(!stats?.budgetRequests || stats.budgetRequests.length === 0) && (
              <p className="text-gray-500 text-center py-4">Нет бюджетных заявок</p>
            )}
          </div>
        </div>
      </div>

      {/* Быстрые действия */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Быстрые действия</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-center">
            <PieChart className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="font-medium text-blue-900">Создать отчет</p>
            <p className="text-sm text-blue-600">Финансовый отчет за период</p>
          </button>
          <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-center">
            <CreditCard className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="font-medium text-green-900">Обработать платежи</p>
            <p className="text-sm text-green-600">Подтвердить поступления</p>
          </button>
          <button className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors text-center">
            <FileText className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <p className="font-medium text-orange-900">Бюджетные заявки</p>
            <p className="text-sm text-orange-600">Рассмотреть заявления</p>
          </button>
          <button 
            className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-center"
            onClick={() => setShowInvoiceGenerator(true)}
          >
            <Download className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="font-medium text-purple-900">Генерация отчетов</p>
            <p className="text-sm text-purple-600">Квитанции и документы</p>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">{error}</p>
        </div>
      )}

      {/* Генератор квитанций */}
      <InvoiceGenerator
        isOpen={showInvoiceGenerator}
        onClose={() => setShowInvoiceGenerator(false)}
        mode="summary"
      />
    </div>
  );
};

export default FinancistDashboard;
