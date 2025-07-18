import React, { useState, useMemo } from 'react';
import { 
  FaChartPie, 
  FaChartLine, 
  FaCalendarAlt, 
  FaFileExport, 
  FaFilter,
  FaPlus,
  FaMinus,
  FaArrowUp,
  FaArrowDown,
  FaEdit,
  FaTrash
} from 'react-icons/fa';
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import DashboardLayout from '../../components/DashboardLayout';

// Типы данных
interface BudgetItem {
  id: string;
  name: string;
  type: 'income' | 'expense';
  category: string;
  plannedAmount: number;
  actualAmount: number;
  variance: number;
  variancePercent: number;
  trend: 'up' | 'down' | 'stable';
  period: string;
  responsible?: string;
  status: 'pending' | 'active' | 'closed';
}

// Константы
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const categoryLabels = {
  income: {
    tuition: 'Оплата за обучение',
    grants: 'Гранты и субсидии',
    donations: 'Пожертвования',
    rentals: 'Аренда помещений',
    other_income: 'Прочие доходы',
    services: 'Дополнительные услуги'
  },
  expense: {
    salaries: 'Зарплаты и компенсации',
    infrastructure: 'Инфраструктура',
    utilities: 'Коммунальные услуги',
    materials: 'Учебные материалы',
    equipment: 'Оборудование',
    events: 'Мероприятия',
    services: 'Услуги сторонних организаций',
    other_expense: 'Прочие расходы'
  }
};

const statusLabels = {
  pending: 'Ожидается',
  active: 'Активен',
  closed: 'Закрыт'
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800'
};

const trendIcons = {
  up: <FaArrowUp className="text-green-600" />,
  down: <FaArrowDown className="text-red-600" />,
  stable: <FaMinus className="text-gray-600" />
};

// Демо-данные
const initialBudgetItems: BudgetItem[] = [
  {
    id: 'b001',
    name: 'Оплата за обучение',
    type: 'income',
    category: 'tuition',
    plannedAmount: 25000000,
    actualAmount: 27500000,
    variance: 2500000,
    variancePercent: 10,
    trend: 'up',
    period: '2024 Q3',
    status: 'active'
  },
  {
    id: 'b002',
    name: 'Государственный грант',
    type: 'income',
    category: 'grants',
    plannedAmount: 8000000,
    actualAmount: 8000000,
    variance: 0,
    variancePercent: 0,
    trend: 'stable',
    period: '2024 Q3',
    status: 'closed'
  },
  {
    id: 'b003',
    name: 'Доходы от дополнительных занятий',
    type: 'income',
    category: 'services',
    plannedAmount: 5000000,
    actualAmount: 4200000,
    variance: -800000,
    variancePercent: -16,
    trend: 'down',
    period: '2024 Q3',
    status: 'active'
  },
  {
    id: 'b004',
    name: 'Зарплаты преподавателей',
    type: 'expense',
    category: 'salaries',
    plannedAmount: 18000000,
    actualAmount: 18500000,
    variance: -500000,
    variancePercent: -2.8,
    trend: 'down',
    period: '2024 Q3',
    responsible: 'Джумабаева А.К.',
    status: 'active'
  },
  {
    id: 'b005',
    name: 'Коммунальные платежи',
    type: 'expense',
    category: 'utilities',
    plannedAmount: 2500000,
    actualAmount: 2400000,
    variance: 100000,
    variancePercent: 4,
    trend: 'up',
    period: '2024 Q3',
    responsible: 'Нурланов Б.М.',
    status: 'active'
  },
  {
    id: 'b006',
    name: 'Покупка компьютерной техники',
    type: 'expense',
    category: 'equipment',
    plannedAmount: 3000000,
    actualAmount: 3200000,
    variance: -200000,
    variancePercent: -6.7,
    trend: 'down',
    period: '2024 Q3',
    responsible: 'Ахметов Д.Е.',
    status: 'closed'
  },
  {
    id: 'b007',
    name: 'Ремонт кабинетов',
    type: 'expense',
    category: 'infrastructure',
    plannedAmount: 1500000,
    actualAmount: 1800000,
    variance: -300000,
    variancePercent: -20,
    trend: 'down',
    period: '2024 Q3',
    responsible: 'Нурланов Б.М.',
    status: 'closed'
  },
  {
    id: 'b008',
    name: 'Учебные материалы',
    type: 'expense',
    category: 'materials',
    plannedAmount: 1200000,
    actualAmount: 950000,
    variance: 250000,
    variancePercent: 20.8,
    trend: 'up',
    period: '2024 Q3',
    responsible: 'Джумабаева А.К.',
    status: 'active'
  },
  {
    id: 'b009',
    name: 'Аренда помещений для мероприятий',
    type: 'income',
    category: 'rentals',
    plannedAmount: 800000,
    actualAmount: 950000,
    variance: 150000,
    variancePercent: 18.8,
    trend: 'up',
    period: '2024 Q3',
    status: 'active'
  },
  {
    id: 'b010',
    name: 'Школьные мероприятия',
    type: 'expense',
    category: 'events',
    plannedAmount: 1000000,
    actualAmount: 850000,
    variance: 150000,
    variancePercent: 15,
    trend: 'up',
    period: '2024 Q3',
    responsible: 'Алиева Г.С.',
    status: 'active'
  }
];

// Данные для графиков
const quarterlyTrends = [
  { name: 'Q1 2023', доходы: 34000000, расходы: 30000000 },
  { name: 'Q2 2023', доходы: 38000000, расходы: 35000000 },
  { name: 'Q3 2023', доходы: 32000000, расходы: 31000000 },
  { name: 'Q4 2023', доходы: 41000000, расходы: 38000000 },
  { name: 'Q1 2024', доходы: 36000000, расходы: 33000000 },
  { name: 'Q2 2024', доходы: 40000000, расходы: 37000000 },
  { name: 'Q3 2024', доходы: 42000000, расходы: 36000000 },
  { name: 'Q4 2024 (прогноз)', доходы: 45000000, расходы: 39000000 }
];

// Демо-данные для структуры доходов
const incomeData = [
  { name: 'Оплата за обучение', value: 68, color: '#3B82F6' },
  { name: 'Гранты и субсидии', value: 20, color: '#10B981' },
  { name: 'Дополнительные услуги', value: 10, color: '#F59E0B' },
  { name: 'Аренда помещений', value: 2, color: '#EC4899' }
];

// Демо-данные для структуры расходов
const expenseData = [
  { name: 'Зарплаты и компенсации', value: 67, color: '#3B82F6' },
  { name: 'Оборудование', value: 12, color: '#F59E0B' },
  { name: 'Коммунальные услуги', value: 9, color: '#10B981' },
  { name: 'Инфраструктура', value: 6, color: '#6366F1' },
  { name: 'Учебные материалы', value: 3, color: '#EC4899' },
  { name: 'Мероприятия', value: 3, color: '#8B5CF6' }
];

// Демо-данные для графика динамики
const dynamicsData = [
  { name: 'Q1 2023', доходы: 30000000, расходы: 28000000 },
  { name: 'Q2 2023', доходы: 32000000, расходы: 30000000 },
  { name: 'Q3 2023', доходы: 32000000, расходы: 31000000 },
  { name: 'Q4 2023', доходы: 35000000, расходы: 33000000 },
  { name: 'Q1 2024', доходы: 33000000, расходы: 31000000 },
  { name: 'Q2 2024', доходы: 34000000, расходы: 32000000 },
  { name: 'Q3 2024', доходы: 35000000, расходы: 33000000 },
  { name: 'Q4 2024 (прогноз)', доходы: 36000000, расходы: 34000000 }
];

const BudgetPage: React.FC = () => {
  // Состояния
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>(initialBudgetItems);
  const [activeTab, setActiveTab] = useState<'overview' | 'income' | 'expense'>('overview');
  const [filters, setFilters] = useState({
    period: '2024 Q3',
    type: '',
    category: '',
    status: ''
  });
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showBudgetItemModal, setShowBudgetItemModal] = useState(false);
  const [selectedBudgetItem, setSelectedBudgetItem] = useState<BudgetItem | null>(null);

  // Вычисляемые данные
  const filteredBudgetItems = useMemo(() => {
    return budgetItems.filter(item => {
      // Фильтр по периоду
      const periodMatch = !filters.period || item.period === filters.period;
      
      // Фильтр по типу
      const typeMatch = !filters.type || item.type === filters.type;
      
      // Фильтр по категории
      const categoryMatch = !filters.category || item.category === filters.category;
      
      // Фильтр по статусу
      const statusMatch = !filters.status || item.status === filters.status;
      
      return periodMatch && typeMatch && categoryMatch && statusMatch;
    });
  }, [budgetItems, filters]);

  // Фильтр по активной вкладке
  const displayedBudgetItems = useMemo(() => {
    if (activeTab === 'overview') return filteredBudgetItems;
    return filteredBudgetItems.filter(item => item.type === activeTab);
  }, [filteredBudgetItems, activeTab]);

  // Суммарные значения
  const summaryStats = useMemo(() => {
    const totalPlannedIncome = filteredBudgetItems
      .filter(item => item.type === 'income')
      .reduce((sum, item) => sum + item.plannedAmount, 0);

    const totalActualIncome = filteredBudgetItems
      .filter(item => item.type === 'income')
      .reduce((sum, item) => sum + item.actualAmount, 0);

    const totalPlannedExpense = filteredBudgetItems
      .filter(item => item.type === 'expense')
      .reduce((sum, item) => sum + item.plannedAmount, 0);

    const totalActualExpense = filteredBudgetItems
      .filter(item => item.type === 'expense')
      .reduce((sum, item) => sum + item.actualAmount, 0);

    const plannedBalance = totalPlannedIncome - totalPlannedExpense;
    const actualBalance = totalActualIncome - totalActualExpense;

    return {
      totalPlannedIncome,
      totalActualIncome,
      totalPlannedExpense,
      totalActualExpense,
      plannedBalance,
      actualBalance,
      incomeVariance: totalActualIncome - totalPlannedIncome,
      incomeVariancePercent: totalPlannedIncome ? Math.round(((totalActualIncome - totalPlannedIncome) / totalPlannedIncome) * 100) : 0,
      expenseVariance: totalPlannedExpense - totalActualExpense,
      expenseVariancePercent: totalPlannedExpense ? Math.round(((totalPlannedExpense - totalActualExpense) / totalPlannedExpense) * 100) : 0,
      balanceVariance: actualBalance - plannedBalance,
      balanceVariancePercent: plannedBalance ? Math.round(((actualBalance - plannedBalance) / Math.abs(plannedBalance)) * 100) : 0
    };
  }, [filteredBudgetItems]);

  // Данные для графиков
  const incomeByCategory = useMemo(() => {
    const categories = {} as Record<string, number>;
    
    filteredBudgetItems
      .filter(item => item.type === 'income')
      .forEach(item => {
        if (categories[item.category]) {
          categories[item.category] += item.actualAmount;
        } else {
          categories[item.category] = item.actualAmount;
        }
      });
    
    return Object.entries(categories).map(([category, value]) => ({
      name: categoryLabels.income[category as keyof typeof categoryLabels.income] || category,
      value
    }));
  }, [filteredBudgetItems]);

  const expenseByCategory = useMemo(() => {
    const categories = {} as Record<string, number>;
    
    filteredBudgetItems
      .filter(item => item.type === 'expense')
      .forEach(item => {
        if (categories[item.category]) {
          categories[item.category] += item.actualAmount;
        } else {
          categories[item.category] = item.actualAmount;
        }
      });
    
    return Object.entries(categories).map(([category, value]) => ({
      name: categoryLabels.expense[category as keyof typeof categoryLabels.expense] || category,
      value
    }));
  }, [filteredBudgetItems]);

  // Обработчики событий
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      period: '2024 Q3',
      type: '',
      category: '',
      status: ''
    });
    setShowFilterModal(false);
  };

  const handleRowClick = (item: BudgetItem) => {
    setSelectedBudgetItem(item);
    setShowBudgetItemModal(true);
  };

  const handleTabChange = (tab: 'overview' | 'income' | 'expense') => {
    setActiveTab(tab);
  };

  // Форматирование чисел в тенге
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU').format(value) + ' ₸';
  };

  // Компоненты
  const FilterModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h3 className="text-lg font-semibold mb-4">Фильтры</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Период</label>
          <select
            className="w-full border border-gray-300 rounded-md p-2"
            value={filters.period}
            onChange={(e) => handleFilterChange('period', e.target.value)}
          >
            <option value="2024 Q3">2024 Q3</option>
            <option value="2024 Q2">2024 Q2</option>
            <option value="2024 Q1">2024 Q1</option>
            <option value="2023 Q4">2023 Q4</option>
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Тип</label>
          <select
            className="w-full border border-gray-300 rounded-md p-2"
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
          >
            <option value="">Все типы</option>
            <option value="income">Доходы</option>
            <option value="expense">Расходы</option>
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Категория</label>
          <select
            className="w-full border border-gray-300 rounded-md p-2"
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
          >
            <option value="">Все категории</option>
            <optgroup label="Доходы">
              {Object.entries(categoryLabels.income).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </optgroup>
            <optgroup label="Расходы">
              {Object.entries(categoryLabels.expense).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </optgroup>
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
          <select
            className="w-full border border-gray-300 rounded-md p-2"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">Все статусы</option>
            <option value="pending">Ожидается</option>
            <option value="active">Активен</option>
            <option value="closed">Закрыт</option>
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

  // Модальное окно с детальной информацией о бюджетной статье
  const BudgetItemModal = () => {
    if (!selectedBudgetItem) return null;
    
    const categoryType = selectedBudgetItem.type === 'income' ? categoryLabels.income : categoryLabels.expense;
    const categoryLabel = categoryType[selectedBudgetItem.category as keyof typeof categoryType] || selectedBudgetItem.category;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-[600px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">{selectedBudgetItem.name}</h3>
            <button onClick={() => setShowBudgetItemModal(false)} className="text-gray-500">
              &times;
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500">Тип</p>
              <p className="font-medium">
                {selectedBudgetItem.type === 'income' ? 'Доход' : 'Расход'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Категория</p>
              <p className="font-medium">{categoryLabel}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Период</p>
              <p className="font-medium">{selectedBudgetItem.period}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Статус</p>
              <span className={`inline-block px-2 py-1 rounded-full text-xs ${statusColors[selectedBudgetItem.status]}`}>
                {statusLabels[selectedBudgetItem.status]}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Плановая сумма</p>
              <p className="font-medium">{selectedBudgetItem.plannedAmount.toLocaleString()} тг</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Фактическая сумма</p>
              <p className="font-medium">{selectedBudgetItem.actualAmount.toLocaleString()} тг</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Разница</p>
              <p className={`font-medium ${selectedBudgetItem.variance > 0 ? 'text-green-600' : selectedBudgetItem.variance < 0 ? 'text-red-600' : ''}`}>
                {selectedBudgetItem.variance > 0 ? '+' : ''}{selectedBudgetItem.variance.toLocaleString()} тг ({selectedBudgetItem.variancePercent > 0 ? '+' : ''}{selectedBudgetItem.variancePercent}%)
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Тренд</p>
              <div className="flex items-center">
                {trendIcons[selectedBudgetItem.trend]}
                <span className="ml-1">{selectedBudgetItem.trend === 'up' ? 'Рост' : selectedBudgetItem.trend === 'down' ? 'Снижение' : 'Стабильно'}</span>
              </div>
            </div>
            {selectedBudgetItem.responsible && (
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Ответственный</p>
                <p className="font-medium">{selectedBudgetItem.responsible}</p>
              </div>
            )}
          </div>
          
          {/* Тренд по данной статье за последние периоды (демо-данные) */}
          <div className="mb-6">
            <h4 className="text-sm font-medium mb-2">Динамика по периодам</h4>
            <div className="h-60 bg-gray-50 p-4 rounded-lg">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={[
                    { name: 'Q1 2024', план: selectedBudgetItem.plannedAmount * 0.85, факт: selectedBudgetItem.actualAmount * 0.8 },
                    { name: 'Q2 2024', план: selectedBudgetItem.plannedAmount * 0.9, факт: selectedBudgetItem.actualAmount * 0.9 },
                    { name: 'Q3 2024', план: selectedBudgetItem.plannedAmount, факт: selectedBudgetItem.actualAmount },
                    { name: 'Q4 2024', план: selectedBudgetItem.plannedAmount * 1.1, факт: null }
                  ]}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => value ? `${value.toLocaleString()} тг` : 'Нет данных'} />
                  <Legend />
                  <Line type="monotone" dataKey="план" stroke="#8884d8" strokeDasharray="5 5" />
                  <Line type="monotone" dataKey="факт" stroke="#82ca9d" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button className="px-4 py-2 border border-gray-300 rounded-md text-sm flex items-center">
              <FaEdit className="mr-2" /> Редактировать
            </button>
            <button className="px-4 py-2 bg-red-600 text-white rounded-md text-sm flex items-center">
              <FaTrash className="mr-2" /> Удалить
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Рендер
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Бюджет и прогноз</h1>
      
      {/* Фильтры и действия */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <button 
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center"
            onClick={() => setShowFilterModal(true)}
          >
            <FaFilter className="mr-2" />
            Фильтры
            {(filters.type || filters.category || filters.status) && (
              <span className="ml-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {Object.values(filters).filter(Boolean).length}
              </span>
            )}
          </button>
        </div>
        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            + Добавить статью
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            Экспорт
          </button>
        </div>
      </div>

      {/* Основной контент */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* Доходы */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Доходы</h2>
            <div className="text-sm text-gray-500">{filters.period}</div>
          </div>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">План</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(summaryStats.totalPlannedIncome)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Факт</div>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(summaryStats.totalActualIncome)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Отклонение</div>
              <div className={`text-lg font-semibold flex items-center ${
                summaryStats.incomeVariance >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {summaryStats.incomeVariance >= 0 ? (
                  <FaArrowUp className="mr-1" />
                ) : (
                  <FaArrowDown className="mr-1" />
                )}
                {formatCurrency(Math.abs(summaryStats.incomeVariance))}
                <span className="text-sm ml-1">
                  ({summaryStats.incomeVariance >= 0 ? '+' : ''}{summaryStats.incomeVariancePercent}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Расходы */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Расходы</h2>
            <div className="text-sm text-gray-500">{filters.period}</div>
          </div>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">План</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(summaryStats.totalPlannedExpense)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Факт</div>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(summaryStats.totalActualExpense)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Отклонение</div>
              <div className={`text-lg font-semibold flex items-center ${
                summaryStats.expenseVariance >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {summaryStats.expenseVariance >= 0 ? (
                  <FaArrowUp className="mr-1" />
                ) : (
                  <FaArrowDown className="mr-1" />
                )}
                {formatCurrency(Math.abs(summaryStats.expenseVariance))}
                <span className="text-sm ml-1">
                  ({summaryStats.expenseVariance >= 0 ? '+' : ''}{summaryStats.expenseVariancePercent}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Баланс */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Баланс</h2>
            <div className="text-sm text-gray-500">{filters.period}</div>
          </div>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">План</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(summaryStats.plannedBalance)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Факт</div>
              <div className={`text-2xl font-bold ${
                summaryStats.actualBalance >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(summaryStats.actualBalance)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Отклонение</div>
              <div className={`text-lg font-semibold flex items-center ${
                summaryStats.balanceVariance >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {summaryStats.balanceVariance >= 0 ? (
                  <FaArrowUp className="mr-1" />
                ) : (
                  <FaArrowDown className="mr-1" />
                )}
                {formatCurrency(Math.abs(summaryStats.balanceVariance))}
                <span className="text-sm ml-1">
                  ({summaryStats.balanceVariance >= 0 ? '+' : ''}{summaryStats.balanceVariancePercent}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Графики */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* График распределения доходов */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-md font-medium text-gray-700 mb-2">Структура доходов</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={incomeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {incomeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [`${value.toLocaleString()} тг`, '']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* График распределения расходов */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-md font-medium text-gray-700 mb-2">Структура расходов</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [`${value.toLocaleString()} тг`, '']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* График динамики по кварталам */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="text-md font-medium text-gray-700 mb-2">Динамика доходов и расходов по кварталам</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={dynamicsData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.5rem'
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="доходы"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 8 }}
              />
              <Line
                type="monotone"
                dataKey="расходы"
                stroke="#EF4444"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Вкладки */}
      <div className="mb-4 border-b">
        <div className="flex">
          <button
            className={`py-2 px-4 text-sm font-medium ${
              activeTab === 'overview' 
              ? 'border-b-2 border-blue-600 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => handleTabChange('overview')}
          >
            Все статьи
          </button>
          <button
            className={`py-2 px-4 text-sm font-medium ${
              activeTab === 'income' 
              ? 'border-b-2 border-blue-600 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => handleTabChange('income')}
          >
            Доходы
          </button>
          <button
            className={`py-2 px-4 text-sm font-medium ${
              activeTab === 'expense' 
              ? 'border-b-2 border-blue-600 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => handleTabChange('expense')}
          >
            Расходы
          </button>
        </div>
      </div>

      {/* Таблица бюджетных статей */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Название статьи
              </th>
              {activeTab === 'overview' && (
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Тип
                </th>
              )}
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Категория
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                План
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Факт
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Разница
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Статус
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayedBudgetItems.map((item) => {
              const categoryType = item.type === 'income' ? categoryLabels.income : categoryLabels.expense;
              const categoryLabel = categoryType[item.category as keyof typeof categoryType] || item.category;
              
              return (
                <tr 
                  key={item.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleRowClick(item)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        {item.responsible && (
                          <div className="text-sm text-gray-500">Отв: {item.responsible}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  {activeTab === 'overview' && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {item.type === 'income' ? 'Доход' : 'Расход'}
                      </span>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{categoryLabel}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.plannedAmount.toLocaleString()} тг</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.actualAmount.toLocaleString()} тг</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {trendIcons[item.trend]}
                      <span className={`ml-1 text-sm ${
                        item.variance > 0 
                          ? 'text-green-600' 
                          : item.variance < 0 
                            ? 'text-red-600' 
                            : ''
                      }`}>
                        {item.variance > 0 ? '+' : ''}{item.variance.toLocaleString()} тг ({item.variancePercent > 0 ? '+' : ''}{item.variancePercent}%)
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[item.status]}`}>
                      {statusLabels[item.status]}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Модальные окна */}
      {showFilterModal && <FilterModal />}
      {showBudgetItemModal && <BudgetItemModal />}
    </div>
  );
};

export default BudgetPage; 