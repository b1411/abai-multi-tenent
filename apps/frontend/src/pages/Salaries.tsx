import React, { useState, useMemo, useEffect } from 'react';
import { 
  FaFilter, 
  FaFileExport, 
  FaUserTie,
  FaChalkboardTeacher,
  FaUsers,
  FaChartLine,
  FaPlus,
  FaEnvelope,
  FaPhone,
  FaCalendar,
  FaGraduationCap,
  FaMedal,
  FaClock,
  FaCheck,
  FaDollarSign,
  FaEye,
  FaEdit,
  FaTrash,
  FaCalculator,
  FaSync
} from 'react-icons/fa';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Salary, SalaryStatus, BonusType } from '../types/salary';
import { Teacher } from '../types/teacher';
import { formatCurrency } from '../utils/formatters';
import { useSalaries } from '../hooks/useSalaries';
import { useTeachers } from '../hooks/useTeachers';
import { salaryService } from '../services/salaryService';
import SalaryForm from '../components/SalaryForm';

const Salaries: React.FC = () => {
  // Хуки для данных
  const {
    salaries,
    statistics,
    pagination,
    loading,
    error,
    createSalary,
    updateSalary,
    deleteSalary,
    approveSalary,
    markSalaryAsPaid,
    updateFilters,
    resetFilters,
    recalculateSalaries
  } = useSalaries();

  const { teachers, loading: teachersLoading } = useTeachers();

  // Состояния для UI
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSalaryForm, setShowSalaryForm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [editingSalary, setEditingSalary] = useState<Salary | null>(null);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyEmployee, setHistoryEmployee] = useState<any>(null);
  
  // Состояния для истории выплат
  const [salaryHistory, setSalaryHistory] = useState<Salary[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Локальные фильтры для UI
  const [localFilters, setLocalFilters] = useState({
    department: 'all',
    position: 'all',
    period: 'current',
    status: 'all' as string
  });

  // Обработчики
  const handleCreateSalary = async (salaryData: any) => {
    const result = await createSalary(salaryData);
    if (result) {
      setShowSalaryForm(false);
      setEditingSalary(null);
    }
  };

  const handleEditSalary = (salary: Salary) => {
    setEditingSalary(salary);
    setShowSalaryForm(true);
  };

  const handleApproveSalary = async (salaryId: number) => {
    await approveSalary(salaryId);
  };

  const handleMarkAsPaid = async (salaryId: number) => {
    await markSalaryAsPaid(salaryId);
  };

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    await recalculateSalaries();
    setIsRecalculating(false);
  };

  const handleExport = async () => {
    try {
      // Подготавливаем фильтры для экспорта
      const exportFilters: any = {};
      
      if (localFilters.status !== 'all') {
        exportFilters.status = localFilters.status;
      }
      
      // Получаем blob файла
      const blob = await salaryService.exportSalaries(exportFilters, 'xlsx');
      
      // Создаем ссылку для скачивания
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `salaries-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Ошибка при экспорте зарплат:', error);
      alert('Произошла ошибка при экспорте данных');
    }
  };

  // Использовать реальную статистику или дефолтные значения
  const stats = statistics || {
    totalPayroll: 0,
    avgSalary: 0,
    employeeCount: 0,
    statusStats: [],
  };

  // Безопасные значения для departments (пока не реализованы в API)
  const departments = {
    teaching: { count: 0, total: 0, avg: 0 },
    administrative: { count: 0, total: 0, avg: 0 },
    support: { count: 0, total: 0, avg: 0 }
  };

  // Фильтрация зарплат
  const filteredSalaries = useMemo(() => {
    return salaries.filter(salary => {
      if (localFilters.status !== 'all' && salary.status !== localFilters.status) {
        return false;
      }
      return true;
    });
  }, [localFilters, salaries]);

  // Компонент модального окна фильтров
  const FilterModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h3 className="text-lg font-semibold mb-4">Фильтры</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Отдел</label>
          <select
            className="w-full border border-gray-300 rounded-md p-2"
            value={localFilters.department}
            onChange={(e) => setLocalFilters(prev => ({ ...prev, department: e.target.value }))}
          >
            <option value="all">Все отделы</option>
            <option value="teaching">Учителя</option>
            <option value="administrative">Администрация</option>
            <option value="support">Тех. персонал</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
          <select
            className="w-full border border-gray-300 rounded-md p-2"
            value={localFilters.status}
            onChange={(e) => setLocalFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="all">Все статусы</option>
            <option value="DRAFT">Черновик</option>
            <option value="APPROVED">Утверждено</option>
            <option value="PAID">Выплачено</option>
            <option value="CANCELLED">Отменено</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Период</label>
          <select
            className="w-full border border-gray-300 rounded-md p-2"
            value={localFilters.period}
            onChange={(e) => setLocalFilters(prev => ({ ...prev, period: e.target.value }))}
          >
            <option value="current">Текущий месяц</option>
            <option value="previous">Предыдущий месяц</option>
            <option value="quarter">Текущий квартал</option>
          </select>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            className="px-4 py-2 border border-gray-300 rounded-md text-sm"
            onClick={() => {
              setLocalFilters({ department: 'all', position: 'all', period: 'current', status: 'all' });
              setShowFilterModal(false);
            }}
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

  // Компонент модального окна сотрудника
  const EmployeeModal = () => {
    if (!selectedEmployee) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="relative">
            {/* Шапка */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 rounded-t-xl text-white">
              <button 
                onClick={() => setSelectedEmployee(null)}
                className="absolute top-4 right-4 text-white hover:text-gray-200"
              >
                ✕
              </button>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
                  <FaUserTie className="w-12 h-12 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">
                    {selectedEmployee.teacher?.user.surname} {selectedEmployee.teacher?.user.name} {selectedEmployee.teacher?.user.middlename}
                  </h2>
                  <p className="text-blue-100">Преподаватель</p>
                </div>
              </div>
            </div>

            {/* Основная информация */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Левая колонка */}
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Контактная информация</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <FaEnvelope className="text-blue-600" />
                        <span>{selectedEmployee.teacher?.user.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Бонусы</h3>
                    <div className="space-y-2">
                      {selectedEmployee.bonuses?.map((bonus: any, index: number) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm">{bonus.name}</span>
                          <span className="text-green-600 font-medium">+{formatCurrency(bonus.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Правая колонка */}
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Удержания</h3>
                    <div className="space-y-2">
                      {selectedEmployee.deductions?.map((deduction: any, index: number) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm">{deduction.name}</span>
                          <span className="text-red-600 font-medium">-{formatCurrency(deduction.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Статус</h3>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedEmployee.status === 'PAID' ? 'bg-green-100 text-green-800' :
                        selectedEmployee.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' :
                        selectedEmployee.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedEmployee.status === 'PAID' ? 'Выплачено' :
                         selectedEmployee.status === 'APPROVED' ? 'Утверждено' :
                         selectedEmployee.status === 'DRAFT' ? 'Черновик' : 'Отменено'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Зарплата */}
              <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Информация о зарплате</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-white rounded-lg">
                    <div className="text-sm text-gray-600">Оклад</div>
                    <div className="text-xl font-bold text-gray-900">{formatCurrency(selectedEmployee.baseSalary)}</div>
                  </div>
                  <div className="p-4 bg-white rounded-lg">
                    <div className="text-sm text-gray-600">Общая сумма</div>
                    <div className="text-xl font-bold text-green-600">{formatCurrency(selectedEmployee.totalGross)}</div>
                  </div>
                  <div className="p-4 bg-white rounded-lg">
                    <div className="text-sm text-gray-600">К выплате</div>
                    <div className="text-xl font-bold text-blue-600">{formatCurrency(selectedEmployee.totalNet)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Футер */}
            <div className="border-t border-gray-200 p-6 flex justify-between items-center">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FaCalendar />
                <span>Период: {selectedEmployee.month}/{selectedEmployee.year}</span>
              </div>
              <div className="flex gap-3">
                <button 
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
                  onClick={() => {
                    setHistoryEmployee(selectedEmployee);
                    setSelectedEmployee(null);
                    setShowHistoryModal(true);
                  }}
                >
                  История выплат
                </button>
                <button 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                  onClick={() => {
                    setEditingSalary(selectedEmployee);
                    setSelectedEmployee(null);
                    setShowSalaryForm(true);
                  }}
                >
                  Редактировать
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Загружаем историю выплат при изменении historyEmployee
  useEffect(() => {
    const loadSalaryHistory = async () => {
      if (!historyEmployee?.teacher?.id) return;
      
      try {
        setHistoryLoading(true);
        setHistoryError(null);
        const history = await salaryService.getSalaryHistory(historyEmployee.teacher.id);
        setSalaryHistory(history);
      } catch (error) {
        console.error('Ошибка загрузки истории выплат:', error);
        setHistoryError('Не удалось загрузить историю выплат');
      } finally {
        setHistoryLoading(false);
      }
    };

    if (historyEmployee) {
      loadSalaryHistory();
    }
  }, [historyEmployee]);

  // Компонент модального окна истории выплат
  const HistoryModal = () => {
    if (!historyEmployee) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
          {/* Шапка */}
          <div className="bg-gradient-to-r from-green-600 to-green-800 p-6 rounded-t-xl text-white">
            <button 
              onClick={() => setShowHistoryModal(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-200"
            >
              ✕
            </button>
            <div className="flex items-center gap-4">
              <FaClock className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">История выплат</h2>
                <p className="text-green-100">
                  {historyEmployee.teacher?.user.surname} {historyEmployee.teacher?.user.name}
                </p>
              </div>
            </div>
          </div>

          {/* Содержимое */}
          <div className="p-6">
            {/* Статистика */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-blue-600">Общая сумма выплат</div>
                <div className="text-xl font-bold text-blue-800">
                  {formatCurrency(salaryHistory.reduce((sum, h) => sum + h.totalNet, 0))}
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-green-600">Количество выплат</div>
                <div className="text-xl font-bold text-green-800">{salaryHistory.length}</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm text-purple-600">Средняя зарплата</div>
                <div className="text-xl font-bold text-purple-800">
                  {formatCurrency(salaryHistory.reduce((sum, h) => sum + h.totalNet, 0) / salaryHistory.length)}
                </div>
              </div>
            </div>

            {/* Таблица истории */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">Детальная история</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Период
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Оклад
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Бонусы
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Удержания
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        К выплате
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Дата выплаты
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Статус
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {salaryHistory.map((history) => (
                      <tr key={history.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {history.month}/{history.year}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatCurrency(history.baseSalary)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-green-600">
                            +{formatCurrency(history.bonuses.reduce((sum, b) => sum + b.amount, 0))}
                          </div>
                          {history.bonuses.length > 0 && (
                            <div className="text-xs text-gray-500">
                              {history.bonuses.map(b => b.name).join(', ')}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-red-600">
                            -{formatCurrency(history.deductions.reduce((sum, d) => sum + d.amount, 0))}
                          </div>
                          {history.deductions.length > 0 && (
                            <div className="text-xs text-gray-500">
                              {history.deductions.map(d => d.name).join(', ')}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(history.totalNet)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {history.paidAt ? new Date(history.paidAt).toLocaleDateString() : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(history.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Футер */}
          <div className="border-t border-gray-200 p-6 flex justify-end">
            <button 
              className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700"
              onClick={() => setShowHistoryModal(false)}
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Выплачено</span>;
      case 'APPROVED':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">Утверждено</span>;
      case 'DRAFT':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Черновик</span>;
      case 'CANCELLED':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Отменено</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">Неизвестно</span>;
    }
  };

  return (
    <div className="p-6">
      {/* Заголовок и действия */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Управление заработной платой</h1>
        <div className="flex gap-3">
          <button
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center"
            onClick={() => setShowFilterModal(true)}
          >
            <FaFilter className="mr-2" />
            Фильтры
          </button>
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center"
            onClick={() => setShowSalaryForm(true)}
          >
            <FaPlus className="mr-2" />
            Расчет зарплаты
          </button>
          <button 
            className={`px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium transition-colors flex items-center ${
              isRecalculating 
                ? 'bg-yellow-100 text-yellow-700 cursor-not-allowed' 
                : 'hover:bg-gray-50'
            }`}
            onClick={handleRecalculate}
            disabled={isRecalculating}
          >
            {isRecalculating ? (
              <>
                <FaSync className="mr-2 animate-spin" />
                Пересчет...
              </>
            ) : (
              <>
                <FaCalculator className="mr-2" />
                Перерасчет
              </>
            )}
          </button>
          <button 
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center"
            onClick={handleExport}
          >
            <FaFileExport className="mr-2" />
            Экспорт
          </button>
        </div>
      </div>

      {/* Основные показатели */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Фонд оплаты труда</div>
            <FaChartLine className="text-blue-600" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold">{formatCurrency(stats.totalPayroll)}</div>
            <div className="text-sm text-green-600 flex items-center mt-1">
              <span>к прошлому месяцу</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Средняя зарплата</div>
            <FaUserTie className="text-blue-600" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold">{formatCurrency(stats.avgSalary)}</div>
            <div className="text-sm text-green-600 flex items-center mt-1">
              <span>+3.8% к прошлому месяцу</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Сотрудников</div>
            <FaUsers className="text-blue-600" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold">{stats.employeeCount}</div>
            <div className="text-sm text-gray-600 flex items-center mt-1">
              <span>{departments.teaching.count} учителей</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Премиальный фонд</div>
            <FaChartLine className="text-blue-600" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold">{formatCurrency(stats.totalPayroll * 0.1)}</div>
            <div className="text-sm text-blue-600 flex items-center mt-1">
              <span>10% от ФОТ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Анализ по отделам */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Распределение по отделам</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Учителя', value: departments.teaching.total, count: departments.teaching.count },
                { name: 'Администрация', value: departments.administrative.total, count: departments.administrative.count },
                { name: 'Тех. персонал', value: departments.support.total, count: departments.support.count }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelStyle={{ color: '#1F2937' }}
                />
                <Bar dataKey="value" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Динамика ФОТ</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[
                { month: 'Янв', value: 11500000 },
                { month: 'Фев', value: 11800000 },
                { month: 'Мар', value: 12000000 },
                { month: 'Апр', value: 12200000 },
                { month: 'Май', value: 12500000 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelStyle={{ color: '#1F2937' }}
                />
                <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Таблица зарплат */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Список зарплат</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Сотрудник
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Период
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Оклад
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  К выплате
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSalaries.map((salary, index) => (
                <tr 
                  key={index} 
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {salary.teacher?.user.surname} {salary.teacher?.user.name}
                    </div>
                    <div className="text-sm text-gray-500">{salary.teacher?.user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{salary.month}/{salary.year}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatCurrency(salary.baseSalary!)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{formatCurrency(salary.totalNet!)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(salary.status!)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedEmployee(salary)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Просмотр"
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={() => handleEditSalary(salary)}
                        className="text-green-600 hover:text-green-900"
                        title="Редактировать"
                      >
                        <FaEdit />
                      </button>
                      {salary.status === 'APPROVED' && (
                        <button
                          onClick={() => handleMarkAsPaid(salary.id!)}
                          className="text-purple-600 hover:text-purple-900"
                          title="Отметить как выплаченную"
                        >
                          <FaDollarSign />
                        </button>
                      )}
                      {salary.status === 'DRAFT' && (
                        <button
                          onClick={() => handleApproveSalary(salary.id!)}
                          className="text-green-600 hover:text-green-900"
                          title="Утвердить"
                        >
                          <FaCheck />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Модальные окна */}
      {showFilterModal && <FilterModal />}
      {selectedEmployee && <EmployeeModal />}
      {showHistoryModal && <HistoryModal />}
      
      {/* Форма зарплаты */}
      <SalaryForm
        isOpen={showSalaryForm}
        onClose={() => {
          setShowSalaryForm(false);
          setEditingSalary(null);
        }}
        onSubmit={handleCreateSalary}
        teachers={teachers}
        editingSalary={editingSalary}
        isLoading={loading}
      />
    </div>
  );
};

export default Salaries;
