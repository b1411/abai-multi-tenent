import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Filter, 
  BarChart3,
  Calendar,
  ExternalLink,
  TrendingUp,
  DollarSign,
  Users
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { financeService } from '../services/financeService';
import { PermissionGuard } from '../components/PermissionGuard';

interface FinancialReport {
  id: string;
  title: string;
  period: string;
  generatedAt: string;
  type: 'BUDGET_ANALYSIS' | 'CASHFLOW' | 'PERFORMANCE' | 'FORECAST' | 'VARIANCE' | 'INCOME_STATEMENT' | 'BALANCE_SHEET';
  status: 'GENERATING' | 'COMPLETED' | 'FAILED';
  generatedBy: string;
  description?: string;
  tags: string[];
}

// Константы
const reportTypeLabels = {
  BUDGET_ANALYSIS: 'Анализ бюджета',
  CASHFLOW: 'Движение денежных средств',
  PERFORMANCE: 'Показатели эффективности',
  FORECAST: 'Финансовый прогноз',
  VARIANCE: 'Анализ отклонений',
  INCOME_STATEMENT: 'Отчет о доходах и расходах',
  BALANCE_SHEET: 'Баланс школы'
};

const statusLabels = {
  GENERATING: 'Генерируется',
  COMPLETED: 'Завершен',
  FAILED: 'Ошибка'
};

const statusColors = {
  GENERATING: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800'
};

/* Удалить этот хук из глобального scope и перенести внутрь компонента Reports */

const Reports: React.FC = () => {
  const [reports, setReports] = useState<FinancialReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    period: 'all',
    type: 'all',
    status: 'all'
  });
  const [selectedReport, setSelectedReport] = useState<FinancialReport | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [cashflowData, setCashflowData] = useState<any[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);
  const [monthlyRevenueData, setMonthlyRevenueData] = useState<any[]>([]);

  // Загрузка данных
  useEffect(() => {
    loadReportsData();
  }, []);

  // Загрузка данных для графика после получения cashflowData
  useEffect(() => {
    loadMonthlyRevenue();
  }, [cashflowData]);

  const loadReportsData = async () => {
    try {
      setLoading(true);

      // Загружаем данные движения денежных средств
      const startDate = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];

      // Получаем реальные данные cashflow
      const cashflow = await financeService.getCashflowData(`startDate=${startDate}&endDate=${endDate}`);
      
      // Получаем реальные данные performance
      const performance = await financeService.getPerformanceMetrics(`startDate=${startDate}&endDate=${endDate}`);

      setCashflowData(Array.isArray(cashflow) ? cashflow : []);
      setPerformanceMetrics(performance);

      // Моковые отчеты (поскольку нет эндпоинта для списка отчетов)
      const mockReports: FinancialReport[] = [
        {
          id: '1',
          title: 'Отчет о движении денежных средств - Январь 2025',
          period: '2025-01',
          generatedAt: new Date().toISOString(),
          type: 'CASHFLOW',
          status: 'COMPLETED',
          generatedBy: 'Система',
          description: 'Анализ входящих и исходящих денежных потоков за январь 2025',
          tags: ['движение-денежных-средств', '2025', 'январь']
        },
        {
          id: '2',
          title: 'Показатели эффективности - Январь 2025',
          period: '2025-01',
          generatedAt: new Date().toISOString(),
          type: 'PERFORMANCE',
          status: 'COMPLETED',
          generatedBy: 'Система',
          description: 'Анализ ключевых показателей эффективности за январь 2025',
          tags: ['показатели-эффективности', '2025', 'январь']
        }
      ];
      
      setReports(mockReports);
    } catch (error) {
      console.error('Ошибка загрузки данных отчетов:', error);
      setCashflowData([]);
      setPerformanceMetrics(null);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMonthlyRevenue = async () => {
    try {
      // Используем те же данные, что и для статистики
      if (cashflowData && Array.isArray(cashflowData)) {
        // Преобразуем данные для графика
        const chartData = cashflowData.map((item: any) => ({
          name: new Date(item.period + '-01').toLocaleDateString('ru-RU', { month: 'short' }),
          value: item.income || 0,
          expense: item.expense || 0,
          netFlow: item.netFlow || 0
        }));
        setMonthlyRevenueData(chartData);
      } else {
        setMonthlyRevenueData([]);
      }
    } catch (error) {
      setMonthlyRevenueData([]);
      console.error('Ошибка загрузки данных для графика доходов:', error);
    }
  };

  // Вычисляемые данные
  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      const typeMatch = filters.type === 'all' || report.type === filters.type;
      const periodMatch = filters.period === 'all' || report.period.includes(filters.period);
      const statusMatch = filters.status === 'all' || report.status === filters.status;
      return typeMatch && periodMatch && statusMatch;
    });
  }, [reports, filters]);

  // Статистика
  const stats = useMemo(() => {
    // Рассчитываем статистику на основе реальных данных
    const totalIncome = cashflowData.reduce((sum, item) => sum + (item.income || 0), 0);
    const totalExpense = cashflowData.reduce((sum, item) => sum + (item.expense || 0), 0);
    const avgPayment = cashflowData.length > 0 ? totalIncome / cashflowData.length : 0;
    
    return {
      totalIncome: totalIncome.toLocaleString('ru-RU'),
      avgPayment: avgPayment.toLocaleString('ru-RU'),
      activeStudents: 245, // можно получить из API students если нужно
      growthRate: Math.round(performanceMetrics?.revenueGrowth || 0)
    };
  }, [cashflowData, performanceMetrics]);

  // Обработчики событий
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      period: 'all',
      type: 'all',
      status: 'all'
    });
    setShowFilterModal(false);
  };

  const handleRowClick = (report: FinancialReport) => {
    setSelectedReport(report);
    setShowReportModal(true);
  };

  const handleGenerateReport = async (type: string) => {
    try {
      const generateReportDto = {
        type: type as any,
        startDate: new Date(new Date().getFullYear(), 0, 1).toISOString(),
        endDate: new Date().toISOString(),
        title: `${reportTypeLabels[type as keyof typeof reportTypeLabels]} - ${new Date().toLocaleDateString('ru-RU')}`
      };

      await financeService.generateReport(generateReportDto.type, generateReportDto, 'pdf');
      await loadReportsData(); // Перезагружаем список отчетов
    } catch (error) {
      console.error('Ошибка генерации отчета:', error);
    }
  };

  // Компоненты фильтров
  const FilterModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-sm sm:max-w-md">
        <h3 className="text-base sm:text-lg font-semibold mb-4">Фильтры</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Тип отчета</label>
          <select
            className="w-full border border-gray-300 rounded-md p-2"
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
          >
            <option value="all">Все типы</option>
            {Object.entries(reportTypeLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Период</label>
          <select
            className="w-full border border-gray-300 rounded-md p-2"
            value={filters.period}
            onChange={(e) => handleFilterChange('period', e.target.value)}
          >
            <option value="all">Все периоды</option>
            <option value="2024">2024 год</option>
            <option value="Q4">Q4 2024</option>
            <option value="Декабрь">Декабрь</option>
            <option value="2025">2025 год</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
          <select
            className="w-full border border-gray-300 rounded-md p-2"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="all">Все статусы</option>
            {Object.entries(statusLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-sm"
            onClick={handleResetFilters}
          >
            Сбросить
          </button>
          <button
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md text-sm"
            onClick={() => setShowFilterModal(false)}
          >
            Применить
          </button>
        </div>
      </div>
    </div>
  );

  // Модальное окно отчета
  const ReportModal: React.FC<{
    report: FinancialReport | null;
    onClose: () => void;
    show: boolean;
  }> = ({ report, onClose, show }) => {
    if (!report || !show) return null;

    const getStatusColor = (status: string) => statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800';

    const getTypeIcon = (type: string) => {
      switch (type) {
        case 'BALANCE_SHEET': return '⚖️';
        case 'CASHFLOW': return '📈';
        case 'PERFORMANCE': return '📊';
        case 'FORECAST': return '🔮';
        case 'VARIANCE': return '📉';
        default: return '📄';
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-sm sm:max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 sm:px-6 py-3 sm:py-4 rounded-t-lg">
            <div className="flex justify-between items-start">
              <h2 className="text-lg sm:text-2xl font-bold text-white flex-1 min-w-0 pr-2">{report.title}</h2>
              <button onClick={onClose} className="text-white hover:text-gray-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(report.status)}`}>
                {statusLabels[report.status]}
              </span>
              <span className="text-white text-sm">•</span>
              <span className="text-white text-sm">{report.period}</span>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{getTypeIcon(report.type)}</span>
                  <h3 className="text-lg font-semibold">Тип отчета</h3>
                </div>
                <p className="text-gray-600">{reportTypeLabels[report.type]}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">👤</span>
                  <h3 className="text-lg font-semibold">Создан</h3>
                </div>
                <p className="text-gray-600">{report.generatedBy}</p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Описание</h3>
              <p className="text-gray-600">{report.description}</p>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Теги</h3>
              <div className="flex flex-wrap gap-2">
                {report.tags.map((tag, index) => (
                  <span key={index} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="border-t pt-4 mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between text-sm text-gray-500 space-y-3 sm:space-y-0">
              <span>Создан: {new Date(report.generatedAt).toLocaleDateString('ru-RU')}</span>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors text-sm">
                  Экспорт
                </button>
                <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 transition-colors text-sm">
                  Скачать PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Рендер
  return (
    <div className="p-3 sm:p-4 lg:p-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 lg:mb-6">Финансовые отчеты и прогнозы</h1>
      
      {/* Фильтры и действия */}
      <div className="flex flex-col space-y-3 sm:flex-row sm:justify-between sm:items-center sm:space-y-0 mb-4 lg:mb-6">
        <div className="flex items-center space-x-3">
          <button 
            className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center"
            onClick={() => setShowFilterModal(true)}
          >
            <Filter className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Фильтры</span>
            <span className="sm:hidden">Фильтр</span>
            {(filters.period !== 'all' || filters.type !== 'all' || filters.status !== 'all') && (
              <span className="ml-2 bg-blue-600 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                {Object.values(filters).filter(v => v !== 'all').length}
              </span>
            )}
          </button>
        </div>
        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-x-3 sm:space-y-0">
          <PermissionGuard module="reports" action="create">
            <button 
              className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
              onClick={() => handleGenerateReport('PERFORMANCE')}
            >
              <BarChart3 className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Сгенерировать отчет</span>
              <span className="sm:hidden">Создать</span>
            </button>
          </PermissionGuard>
          <PermissionGuard module="reports" action="read">
            <button className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center">
              <ExternalLink className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Экспорт
            </button>
          </PermissionGuard>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 lg:mb-6">
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-xs sm:text-sm text-gray-600">Общий доход</div>
            <TrendingUp className="text-blue-600 h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="text-base sm:text-2xl font-bold mt-1 sm:mt-2 truncate">{stats.totalIncome} KZT</div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-xs sm:text-sm text-gray-600">Средний платеж</div>
            <DollarSign className="text-blue-600 h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="text-base sm:text-2xl font-bold mt-1 sm:mt-2 truncate">{stats.avgPayment} KZT</div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-xs sm:text-sm text-gray-600">Активных учеников</div>
            <Users className="text-blue-600 h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="text-base sm:text-2xl font-bold mt-1 sm:mt-2">{stats.activeStudents}</div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <div className="text-xs sm:text-sm text-gray-600">Рост дохода</div>
            <BarChart3 className="text-blue-600 h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="text-base sm:text-2xl font-bold mt-1 sm:mt-2">+{stats.growthRate}%</div>
          <div className="w-full bg-gray-200 rounded-full h-2 sm:h-2.5 mt-2">
            <div 
              className="bg-blue-600 h-2 sm:h-2.5 rounded-full" 
              style={{ width: `${Math.min(stats.growthRate, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* График доходов */}
      <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-xl shadow-sm mb-4 lg:mb-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Динамика доходов и расходов</h2>
        <div className="h-64 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyRevenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => `${value.toLocaleString()} KZT`}
                labelStyle={{ color: '#1F2937' }}
                contentStyle={{ 
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.5rem'
                }}
              />
              <Legend />
              <Bar 
                dataKey="value" 
                name="Доходы" 
                fill="#3B82F6" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Таблица отчетов */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800">Список отчетов</h3>
        </div>
        
        {/* Desktop Table View */}
        <div className="hidden lg:block">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Название отчета
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Тип
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Период
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дата создания
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReports.map((report) => (
                <tr 
                  key={report.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleRowClick(report)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-gray-400 mr-3" />
                      <div className="text-sm font-medium text-gray-900">{report.title}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{reportTypeLabels[report.type]}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{report.period}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[report.status]}`}>
                      {statusLabels[report.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{new Date(report.generatedAt).toLocaleDateString('ru-RU')}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <PermissionGuard module="reports" action="read">
                      <button 
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Логика скачивания
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </PermissionGuard>
                    <PermissionGuard module="reports" action="read">
                      <button 
                        className="text-gray-600 hover:text-gray-900"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Логика экспорта
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </PermissionGuard>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden">
          {filteredReports.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Отчеты не найдены</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredReports.map((report) => (
                <div 
                  key={report.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleRowClick(report)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center mb-2">
                        <FileText className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                        <h3 className="text-sm font-medium text-gray-900 truncate">{report.title}</h3>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center text-xs text-gray-500">
                          <span>Тип: {reportTypeLabels[report.type]}</span>
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar className="w-3 h-3 mr-1" />
                          <span>{report.period}</span>
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <span>Создан: {new Date(report.generatedAt).toLocaleDateString('ru-RU')}</span>
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${statusColors[report.status]}`}>
                          {statusLabels[report.status]}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1 ml-2">
                      <PermissionGuard module="reports" action="read">
                        <button 
                          className="text-blue-600 hover:text-blue-900 p-1.5 rounded transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Логика скачивания
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </PermissionGuard>
                      <PermissionGuard module="reports" action="read">
                        <button 
                          className="text-gray-600 hover:text-gray-900 p-1.5 rounded transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Логика экспорта
                          }}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>
                      </PermissionGuard>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Модальные окна */}
      {showFilterModal && <FilterModal />}
      {showReportModal && <ReportModal report={selectedReport} onClose={() => setShowReportModal(false)} show={showReportModal} />}
    </div>
  );
};

export default Reports;
