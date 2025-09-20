import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  BudgetItem,
  BudgetResponse,
  BudgetAnalytics,
  CreateBudgetItemDto,
  BudgetFilters,
  BUDGET_TYPE_LABELS,
  BUDGET_STATUS_LABELS,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES
} from '../types/finance';
import { financeService } from '../services/financeService';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import { getAcademicQuarterForDate } from '../utils/academicQuarter';
import { useTenantConfig } from '../hooks/useTenantConfig';

const Budget: React.FC = () => {
  const { user } = useAuth();
  const [budgetData, setBudgetData] = useState<BudgetResponse | null>(null);
  const [analytics, setAnalytics] = useState<BudgetAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { config: tenantConfig } = useTenantConfig();
  const defaultPeriodType = tenantConfig?.periodType || 'quarter';
  const currentYear = new Date().getFullYear();
  const [filters, setFilters] = useState<BudgetFilters & { periodType?: string }>({
    periodType: defaultPeriodType,
    period: '',
    type: '',
    category: '',
    status: '',
    responsible: ''
  });
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);

  const canCreateBudget = user?.role === 'ADMIN' || user?.role === 'FINANCIST';

  useEffect(() => {
    loadBudgetData();
  }, [filters]);

  useEffect(() => {
    if (filters.period) {
      loadAnalytics();
    }
  }, [filters.period]);

  // Удалено: selectedQuarter, теперь используем selectedPeriod

  const loadBudgetData = async () => {
    try {
      setLoading(true);
      const data = await financeService.getBudgetItems(filters);
      setBudgetData(data);
    } catch (err) {
      setError('Ошибка загрузки данных бюджета');
      console.error('Error loading budget:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const data = await financeService.getBudgetAnalytics(filters.period || '2024 Q4');
      setAnalytics(data);
    } catch (err) {
      console.error('Error loading analytics:', err);
    }
  };

  const handleCreateBudgetItem = async (data: CreateBudgetItemDto) => {
    try {
      await financeService.createBudgetItem(data);
      setShowCreateForm(false);
      loadBudgetData();
    } catch (err) {
      setError('Ошибка создания статьи бюджета');
      console.error('Error creating budget item:', err);
    }
  };

  const handleUpdateBudgetItem = async (data: CreateBudgetItemDto) => {
    if (!editingItem) return;

    try {
      await financeService.updateBudgetItem(editingItem.id, data);
      setEditingItem(null);
      loadBudgetData();
    } catch (err) {
      setError('Ошибка обновления статьи бюджета');
      console.error('Error updating budget item:', err);
    }
  };

  const handleDeleteBudgetItem = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить эту статью бюджета?')) return;

    try {
      await financeService.deleteBudgetItem(id);
      loadBudgetData();
    } catch (err) {
      setError('Ошибка удаления статьи бюджета');
      console.error('Error deleting budget item:', err);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-KZ', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getVarianceColor = (variance: number) => {
    if (variance > 0) return 'text-green-600';
    if (variance < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CLOSED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Управление бюджетом</h1>
          <p className="text-xs sm:text-sm text-gray-600">
            Планирование и контроль доходов и расходов образовательного учреждения
          </p>
        </div>
        {canCreateBudget && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center justify-center px-3 py-2 sm:px-4 border border-transparent text-xs sm:text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Добавить статью</span>
            <span className="sm:hidden">Добавить</span>
          </button>
        )}
      </div>

      {error && (
        <Alert variant="error" message={error} dismissible onDismiss={() => setError(null)} />
      )}

      {/* Filters */}
      <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Год
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Все годы</option>
              {Array.from({ length: 10 }, (_, i) => {
                const year = new Date().getFullYear() + 2 - i;
                return (
                  <option key={year} value={year.toString()}>
                    {year}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Период
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedPeriod(val);
                let period = '';
                if (tenantConfig?.periodType === 'semester') {
                  if (val === 'half_year_1') period = `${selectedYear} 1 семестр`;
                  else if (val === 'half_year_2') period = `${selectedYear} 2 семестр`;
                  else if (val === 'year') period = `${selectedYear} учебный год`;
                } else {
                  if (val === 'quarter1') period = `${selectedYear} 1 четверть`;
                  else if (val === 'quarter2') period = `${selectedYear} 2 четверть`;
                  else if (val === 'quarter3') period = `${selectedYear} 3 четверть`;
                  else if (val === 'quarter4') period = `${selectedYear} 4 четверть`;
                  else if (val === 'year') period = `${selectedYear} учебный год`;
                }
                setFilters(prev => ({
                  ...prev,
                  periodType: tenantConfig?.periodType,
                  period: val === 'custom' ? '' : period
                }));
              }}
              className="w-full px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Все периоды</option>
              {tenantConfig?.periodType === 'semester'
                ? [
                    <option key="half_year_1" value="half_year_1">1 семестр</option>,
                    <option key="half_year_2" value="half_year_2">2 семестр</option>,
                    <option key="year" value="year">Учебный год</option>,
                    <option key="custom" value="custom">Произвольный</option>
                  ]
                : [
                    <option key="quarter1" value="quarter1">1 четверть (02.09–26.10)</option>,
                    <option key="quarter2" value="quarter2">2 четверть (03.11–28.12)</option>,
                    <option key="quarter3" value="quarter3">3 четверть (08.01–18.03)</option>,
                    <option key="quarter4" value="quarter4">4 четверть (30.03–25.05)</option>,
                    <option key="year" value="year">Учебный год</option>,
                    <option key="custom" value="custom">Произвольный</option>
                  ]
              }
            </select>
            {selectedPeriod === 'custom' && (
              <div className="flex gap-2 mt-2">
                <input
                  type="date"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md"
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  placeholder="Дата от"
                />
                <input
                  type="date"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md"
                  onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                  placeholder="Дата до"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Тип
            </label>
            <select
              value={filters.type || ''}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Все типы</option>
              <option value="INCOME">Доходы</option>
              <option value="EXPENSE">Расходы</option>
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Категория
            </label>
            <select
              value={filters.category || ''}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="w-full px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Все категории</option>
              <option value="tuition">Оплата за обучение</option>
              <option value="salaries">Зарплаты</option>
              <option value="utilities">Коммунальные услуги</option>
              <option value="materials">Учебные материалы</option>
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Статус
            </label>
            <select
              value={filters.status || ''}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Все статусы</option>
              <option value="PENDING">Ожидает</option>
              <option value="ACTIVE">Активно</option>
              <option value="CLOSED">Закрыто</option>
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Ответственный
            </label>
            <input
              type="text"
              value={filters.responsible || ''}
              onChange={(e) => setFilters({ ...filters, responsible: e.target.value })}
              placeholder="Поиск по ответственному"
              className="w-full px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {budgetData?.summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-md flex items-center justify-center">
                  <svg className="w-3 h-3 sm:w-5 sm:h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                  </svg>
                </div>
              </div>
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Плановые доходы</p>
                <p className="text-lg sm:text-2xl font-semibold text-gray-900 truncate">
                  {formatCurrency(budgetData.summary.totalPlannedIncome)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-md flex items-center justify-center">
                  <svg className="w-3 h-3 sm:w-5 sm:h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Фактические доходы</p>
                <p className="text-lg sm:text-2xl font-semibold text-gray-900 truncate">
                  {formatCurrency(budgetData.summary.totalActualIncome)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-100 rounded-md flex items-center justify-center">
                  <svg className="w-3 h-3 sm:w-5 sm:h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                  </svg>
                </div>
              </div>
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Плановые расходы</p>
                <p className="text-lg sm:text-2xl font-semibold text-gray-900 truncate">
                  {formatCurrency(budgetData.summary.totalPlannedExpense)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-100 rounded-md flex items-center justify-center">
                  <svg className="w-3 h-3 sm:w-5 sm:h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Плановый баланс</p>
                <p className={`text-lg sm:text-2xl font-semibold truncate ${getVarianceColor(budgetData.summary.plannedBalance)}`}>
                  {formatCurrency(budgetData.summary.plannedBalance)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Budget Items Table */}
      <div className="bg-white shadow-sm rounded-lg border overflow-hidden">
        <div className="px-3 py-3 sm:px-6 sm:py-4 border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-medium text-gray-900">Статьи бюджета</h3>
        </div>

        {budgetData?.items && budgetData.items.length > 0 ? (
          <>
            {/* Mobile Card View */}
            <div className="block sm:hidden">
              <div className="divide-y divide-gray-200">
                {budgetData.items.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-medium text-gray-900 truncate">{item.name}</h4>
                        {item.description && (
                          <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                        )}
                      </div>
                      <div className="ml-2 flex-shrink-0">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${item.type === 'INCOME' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {BUDGET_TYPE_LABELS[item.type]}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-gray-500">Категория:</span>
                        <div className="font-medium text-gray-900">{item.category}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Статус:</span>
                        <div>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                            {BUDGET_STATUS_LABELS[item.status]}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">План:</span>
                        <div className="font-medium text-gray-900">{formatCurrency(item.plannedAmount)}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Факт:</span>
                        <div className="font-medium text-gray-900">{formatCurrency(item.actualAmount)}</div>
                      </div>
                      {item.responsible && (
                        <div className="col-span-2">
                          <span className="text-gray-500">Ответственный:</span>
                          <div className="font-medium text-gray-900">{item.responsible}</div>
                        </div>
                      )}
                    </div>
                    
                    {canCreateBudget && (
                      <div className="flex justify-end space-x-2 mt-3 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => setEditingItem(item)}
                          className="text-xs text-blue-600 hover:text-blue-900 px-2 py-1"
                        >
                          Изменить
                        </button>
                        <button
                          onClick={() => handleDeleteBudgetItem(item.id)}
                          className="text-xs text-red-600 hover:text-red-900 px-2 py-1"
                        >
                          Удалить
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Название
                    </th>
                    <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Тип
                    </th>
                    <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Категория
                    </th>
                    <th className="px-3 py-2 sm:px-6 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      План
                    </th>
                    <th className="px-3 py-2 sm:px-6 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Факт
                    </th>
                    <th className="px-3 py-2 sm:px-6 sm:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Статус
                    </th>
                    <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ответственный
                    </th>
                    {canCreateBudget && (
                      <th className="px-3 py-2 sm:px-6 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Действия
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {budgetData.items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                        <div>
                          <div className="text-xs sm:text-sm font-medium text-gray-900">{item.name}</div>
                          {item.description && (
                            <div className="text-xs text-gray-500">{item.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${item.type === 'INCOME' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                          {BUDGET_TYPE_LABELS[item.type]}
                        </span>
                      </td>
                      <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                        {item.category}
                      </td>
                      <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 text-right">
                        {formatCurrency(item.plannedAmount)}
                      </td>
                      <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 text-right">
                        {formatCurrency(item.actualAmount)}
                      </td>
                      <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                          {BUDGET_STATUS_LABELS[item.status]}
                        </span>
                      </td>
                      <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                        {item.responsible || '-'}
                      </td>
                      {canCreateBudget && (
                        <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                          <button
                            onClick={() => setEditingItem(item)}
                            className="text-blue-600 hover:text-blue-900 mr-2 sm:mr-3"
                          >
                            <span className="hidden sm:inline">Изменить</span>
                            <span className="sm:hidden">Изм</span>
                          </button>
                          <button
                            onClick={() => handleDeleteBudgetItem(item.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <span className="hidden sm:inline">Удалить</span>
                            <span className="sm:hidden">Уд</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Нет данных</h3>
            <p className="mt-1 text-sm text-gray-500">
              Не найдено статей бюджета для выбранных фильтров.
            </p>
            {canCreateBudget && (
              <div className="mt-6">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Добавить первую статью
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Form Modal */}
      {(showCreateForm || editingItem) && (
        <BudgetItemModal
          item={editingItem}
          onSave={editingItem ? handleUpdateBudgetItem : handleCreateBudgetItem}
          onClose={() => {
            setShowCreateForm(false);
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
};

// Budget Item Modal Component
interface BudgetItemModalProps {
  item?: BudgetItem | null;
  onSave: (data: CreateBudgetItemDto) => void;
  onClose: () => void;
}

const BudgetItemModal: React.FC<BudgetItemModalProps> = ({ item, onSave, onClose }) => {
  const modalQuarterInfo = getAcademicQuarterForDate(new Date());
  const [formData, setFormData] = useState<CreateBudgetItemDto>({
    name: item?.name || '',
    type: item?.type || 'INCOME',
    category: item?.category || '',
    plannedAmount: item?.plannedAmount || 0,
    actualAmount: item?.actualAmount || 0,
    currency: item?.currency || 'KZT',
    period: item?.period || `${modalQuarterInfo.academicYearStartYear} Q${modalQuarterInfo.index}`,
    responsible: item?.responsible || '',
    status: item?.status || 'ACTIVE',
    description: item?.description || ''
  });

  // Извлекаем год и квартал из периода для отдельных селекторов
  const [formYear, setFormYear] = useState(() => {
    if (item?.period) {
      return item.period.split(' ')[0] || modalQuarterInfo.academicYearStartYear.toString();
    }
    return modalQuarterInfo.academicYearStartYear.toString();
  });

  const [formQuarter, setFormQuarter] = useState(() => {
    if (item?.period) {
      return item.period.split(' ')[1] || `Q${modalQuarterInfo.index}`;
    }
    return `Q${modalQuarterInfo.index}`;
  });

  // Обновляем период в formData при изменении года или квартала
  useEffect(() => {
    const newPeriod = formYear && formQuarter ? `${formYear} ${formQuarter}` : '';
    setFormData(prev => ({ ...prev, period: newPeriod }));
  }, [formYear, formQuarter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4">
      <div className="relative top-4 sm:top-20 mx-auto p-4 sm:p-5 border w-full max-w-md sm:w-96 shadow-lg rounded-md bg-white">
        <div className="mt-2 sm:mt-3">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">
            {item ? 'Редактировать статью бюджета' : 'Создать статью бюджета'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Название
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Тип
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'INCOME' | 'EXPENSE' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="INCOME">Доход</option>
                <option value="EXPENSE">Расход</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Категория
              </label>
              <input
                type="text"
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Плановая сумма
                </label>
                <input
                  type="number"
                  required

                  value={formData.plannedAmount}
                  onChange={(e) => setFormData({ ...formData, plannedAmount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Фактическая сумма
                </label>
                <input
                  type="number"

                  value={formData.actualAmount}
                  onChange={(e) => setFormData({ ...formData, actualAmount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Год
                </label>
                <select
                  value={formYear}
                  onChange={(e) => setFormYear(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Array.from({ length: 10 }, (_, i) => {
                    const year = new Date().getFullYear() + 2 - i;
                    return (
                      <option key={year} value={year.toString()}>
                        {year}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Акад. четверть
                </label>
                <select
                  value={formQuarter}
                  onChange={(e) => setFormQuarter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Q1">Q1 (02.09–26.10)</option>
                  <option value="Q2">Q2 (03.11–28.12)</option>
                  <option value="Q3">Q3 (08.01–18.03)</option>
                  <option value="Q4">Q4 (30.03–25.05)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ответственный
              </label>
              <input
                type="text"
                value={formData.responsible}
                onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Описание
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                {item ? 'Сохранить' : 'Создать'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Budget;
