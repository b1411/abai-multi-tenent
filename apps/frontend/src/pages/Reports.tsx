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

// Демо-данные для графиков
const monthlyRevenueData = [
  { name: 'Янв', value: 5200000 },
  { name: 'Фев', value: 4800000 },
  { name: 'Мар', value: 5000000 },
  { name: 'Апр', value: 5300000 },
  { name: 'Май', value: 5500000 },
  { name: 'Июн', value: 4100000 },
  { name: 'Июл', value: 3800000 },
  { name: 'Авг', value: 5000000 },
  { name: 'Сен', value: 5700000 },
  { name: 'Окт', value: 5400000 },
  { name: 'Ноя', value: 5300000 },
  { name: 'Дек', value: 5200000 }
];

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

  // Загрузка данных
  useEffect(() => {
    loadReportsData();
  }, []);

  const loadReportsData = async () => {
    try {
      setLoading(true);
      
      // Загружаем данные движения денежных средств
      const startDate = new Date(new Date().getFullYear(), 0, 1).toISOString();
      const endDate = new Date().toISOString();
      
      // Упрощенная загрузка данных с демо-данными
      const cashflow: any[] = [];
      const performance = null;

      setCashflowData(cashflow);
      setPerformanceMetrics(performance);

      // Создаем демо-отчеты
      const demoReports: FinancialReport[] = [
        {
          id: 'r001',
          title: 'Баланс школы за 4 квартал 2024',
          type: 'BALANCE_SHEET',
          period: 'Q4 2024',
          generatedAt: new Date().toISOString(),
          generatedBy: 'Система',
          status: 'COMPLETED',
          description: 'Квартальный отчет о финансовом состоянии школы',
          tags: ['квартальный', '2024']
        },
        {
          id: 'r002',
          title: 'Отчет о движении денежных средств за декабрь 2024',
          type: 'CASHFLOW',
          period: 'Декабрь 2024',
          generatedAt: new Date().toISOString(),
          generatedBy: 'Система',
          status: 'COMPLETED',
          description: 'Ежемесячный отчет о поступлениях и расходах',
          tags: ['ежемесячный', 'cashflow', '2024']
        },
        {
          id: 'r003',
          title: 'Показатели эффективности за 2024 год',
          type: 'PERFORMANCE',
          period: '2024 год',
          generatedAt: new Date().toISOString(),
          generatedBy: 'Система',
          status: 'COMPLETED',
          description: 'Годовой отчет о ключевых показателях эффективности',
          tags: ['годовой', 'kpi', '2024']
        },
        {
          id: 'r004',
          title: 'Финансовый прогноз на 2025 год',
          type: 'FORECAST',
          period: '2025 год',
          generatedAt: new Date().toISOString(),
          generatedBy: 'Система',
          status: 'GENERATING',
          description: 'Прогноз финансовых показателей на следующий год',
          tags: ['прогноз', '2025']
        }
      ];

      setReports(demoReports);
    } catch (error) {
      console.error('Ошибка загрузки данных отчетов:', error);
    } finally {
      setLoading(false);
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
    if (!performanceMetrics) {
      return {
        totalIncome: '0',
        avgPayment: '0',
        activeStudents: 0,
        growthRate: 0
      };
    }

    return {
      totalIncome: '62,400,000',
      avgPayment: '5,200,000',
      activeStudents: 245,
      growthRate: Math.round(performanceMetrics.revenueGrowth || 0)
    };
  }, [performanceMetrics]);

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h3 className="text-lg font-semibold mb-4">Фильтры</h3>
        
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
        
        <div className="flex justify-end space-x-3">
          <button
            className="px-4 py-2 border border-gray-300 rounded-md text-sm"
            onClick={handleResetFilters}
          >
            Сбросить
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm"
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
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 rounded-t-lg">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">{report.title}</h2>
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

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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

            <div className="border-t pt-4 mt-4 flex items-center justify-between text-sm text-gray-500">
              <span>Создан: {new Date(report.generatedAt).toLocaleDateString('ru-RU')}</span>
              <div className="flex gap-2">
                <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
                  Экспорт
                </button>
                <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 transition-colors">
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
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Финансовые отчеты и прогнозы</h1>
      
      {/* Фильтры и действия */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <button 
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center"
            onClick={() => setShowFilterModal(true)}
          >
            <Filter className="mr-2 h-4 w-4" />
            Фильтры
            {(filters.period !== 'all' || filters.type !== 'all' || filters.status !== 'all') && (
              <span className="ml-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {Object.values(filters).filter(v => v !== 'all').length}
              </span>
            )}
          </button>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center"
            onClick={() => handleGenerateReport('PERFORMANCE')}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Сгенерировать отчет
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center">
            <ExternalLink className="mr-2 h-4 w-4" />
            Экспорт
          </button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Общий доход</div>
            <TrendingUp className="text-blue-600 h-5 w-5" />
          </div>
          <div className="text-2xl font-bold mt-2">{stats.totalIncome} KZT</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Средний платеж</div>
            <DollarSign className="text-blue-600 h-5 w-5" />
          </div>
          <div className="text-2xl font-bold mt-2">{stats.avgPayment} KZT</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Активных учеников</div>
            <Users className="text-blue-600 h-5 w-5" />
          </div>
          <div className="text-2xl font-bold mt-2">{stats.activeStudents}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Рост дохода</div>
            <BarChart3 className="text-blue-600 h-5 w-5" />
          </div>
          <div className="text-2xl font-bold mt-2">+{stats.growthRate}%</div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${Math.min(stats.growthRate, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* График доходов */}
      <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Динамика доходов и расходов</h2>
        <div className="h-80">
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
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Список отчетов</h3>
        </div>
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
                  <button 
                    className="text-blue-600 hover:text-blue-900 mr-3"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Логика скачивания
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button 
                    className="text-gray-600 hover:text-gray-900"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Логика экспорта
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Модальные окна */}
      {showFilterModal && <FilterModal />}
      {showReportModal && <ReportModal report={selectedReport} onClose={() => setShowReportModal(false)} show={showReportModal} />}
    </div>
  );
};

export default Reports;
