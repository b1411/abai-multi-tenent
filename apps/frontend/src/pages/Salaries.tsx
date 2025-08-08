import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  FaSync,
  FaUser
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
import { Salary, SalaryStatus, BonusType, CreateSalaryDto } from '../types/salary';
import { Teacher } from '../types/teacher';
import { formatCurrency } from '../utils/formatters';
import { useSalaries } from '../hooks/useSalaries';
import { useTeachers } from '../hooks/useTeachers';
import { salaryService } from '../services/salaryService';
import SalaryForm from '../components/SalaryForm';
import TeacherSalaryRateForm from '../components/TeacherSalaryRateForm';
import SalaryAdjustmentsModal from '../components/SalaryAdjustmentsModal';
import SalaryCalculationBreakdown from '../components/SalaryCalculationBreakdown';

const Salaries: React.FC = () => {
  const navigate = useNavigate();

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

  // Новые состояния для управления ставками и корректировками
  const [showSalaryRateForm, setShowSalaryRateForm] = useState(false);
  const [selectedTeacherForRate, setSelectedTeacherForRate] = useState<any>(null);
  const [currentTeacherRate, setCurrentTeacherRate] = useState<any>(null);
  const [showAdjustmentsModal, setShowAdjustmentsModal] = useState(false);
  const [selectedSalaryForAdjustments, setSelectedSalaryForAdjustments] = useState<any>(null);

  // Состояния для детального расчета
  const [showCalculationBreakdown, setShowCalculationBreakdown] = useState(false);
  const [selectedSalaryForBreakdown, setSelectedSalaryForBreakdown] = useState<number | null>(null);

  // Состояния для истории выплат
  const [salaryHistory, setSalaryHistory] = useState<Salary[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Состояния для ставки преподавателя в модальном окне
  const [selectedEmployeeRate, setSelectedEmployeeRate] = useState<any>(null);
  const [rateLoading, setRateLoading] = useState(false);

  // Состояния для отработанных часов
  const [selectedEmployeeWorkedHours, setSelectedEmployeeWorkedHours] = useState<any>(null);
  const [workedHoursLoading, setWorkedHoursLoading] = useState(false);

  // Локальные фильтры для UI
  const [localFilters, setLocalFilters] = useState({
    department: 'all',
    position: 'all',
    period: 'current',
    status: 'all' as string
  });

  // Обработчики
  const handleCreateSalary = async (salaryData: CreateSalaryDto) => {
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

    try {
      // Получаем текущий месяц и год для пересчета
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      // Вызываем новую систему пересчета зарплат
      const result = await recalculateSalaries({
        month: currentMonth,
        year: currentYear
      });

      if (result) {
        // Показываем уведомление об успешном пересчете
        alert(`Пересчет завершен успешно! Обновлено записей: ${result.summary?.successful || 0}`);
      }
    } catch (error) {
      console.error('Ошибка при пересчете:', error);
      alert('Произошла ошибка при пересчете зарплат');
    } finally {
      setIsRecalculating(false);
    }
  };

  // Обработчики для управления ставками
  const handleManageTeacherRate = async (teacher: any) => {
    try {
      setSelectedTeacherForRate(teacher);
      // Загружаем текущую ставку преподавателя
      const currentRate = await salaryService.getTeacherSalaryRate(teacher.id);
      setCurrentTeacherRate(currentRate);
      setShowSalaryRateForm(true);
    } catch (error) {
      console.error('Ошибка при загрузке ставки преподавателя:', error);
      setCurrentTeacherRate(null);
      setShowSalaryRateForm(true);
    }
  };

  const handleSubmitTeacherRate = async (rateData: any) => {
    if (!selectedTeacherForRate) return;

    try {
      if (currentTeacherRate) {
        // Обновляем существующую ставку
        await salaryService.updateTeacherSalaryRate(currentTeacherRate.id, rateData);
      } else {
        // Создаем новую ставку
        await salaryService.createTeacherSalaryRate(selectedTeacherForRate.id, rateData);
      }

      // Сбрасываем состояния
      setShowSalaryRateForm(false);
      setSelectedTeacherForRate(null);
      setCurrentTeacherRate(null);

      alert('Ставка преподавателя успешно сохранена!');
    } catch (error) {
      console.error('Ошибка при сохранении ставки:', error);
      alert('Произошла ошибка при сохранении ставки');
    }
  };

  // Обработчики для редактирования корректировок
  const handleEditAdjustments = (salary: any) => {
    setSelectedSalaryForAdjustments(salary);
    setShowAdjustmentsModal(true);
  };

  const handleSubmitAdjustments = async (adjustments: any) => {
    if (!selectedSalaryForAdjustments) return;

    try {
      await salaryService.editSalaryAdjustments(selectedSalaryForAdjustments.id, adjustments);

      // Обновляем список зарплат
      // Здесь можно вызвать refresh из useSalaries

      setShowAdjustmentsModal(false);
      setSelectedSalaryForAdjustments(null);

      alert('Корректировки успешно сохранены!');
    } catch (error) {
      console.error('Ошибка при сохранении корректировок:', error);
      alert('Произошла ошибка при сохранении корректировок');
    }
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

                  {/* Информация о ставке преподавателя */}
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-purple-800">Ставка преподавателя</h3>
                      {rateLoading && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                      )}
                    </div>

                    {selectedEmployeeRate ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-purple-700">Базовая ставка:</span>
                          <span className="font-medium text-purple-900">{formatCurrency(selectedEmployeeRate.baseRate)}</span>
                        </div>

                        {selectedEmployeeRate.factors && selectedEmployeeRate.factors.length > 0 && (
                          <div>
                            <div className="text-sm text-purple-700 mb-2">Факторы:</div>
                            <div className="space-y-1">
                              {selectedEmployeeRate.factors.map((factor: any, index: number) => (
                                <div key={index} className="flex items-center justify-between text-sm">
                                  <span className="text-purple-600">{factor.name}</span>
                                  <span className="font-medium text-purple-800">+{formatCurrency(factor.amount)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="border-t border-purple-300 pt-2 flex items-center justify-between">
                          <span className="text-sm font-medium text-purple-700">Итоговая ставка:</span>
                          <span className="text-lg font-bold text-purple-900">{formatCurrency(selectedEmployeeRate.totalRate)}/час</span>
                        </div>

                        {selectedEmployeeRate.createdAt && (
                          <div className="text-xs text-purple-600">
                            Настроена: {new Date(selectedEmployeeRate.createdAt).toLocaleDateString('ru-RU')}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        {rateLoading ? (
                          <div className="text-purple-600">Загрузка ставки...</div>
                        ) : (
                          <div className="text-purple-600">Ставка не настроена</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Информация об отработанных часах */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-blue-800">Отработанные часы</h3>
                      {workedHoursLoading && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      )}
                    </div>

                    {selectedEmployeeWorkedHours ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white p-3 rounded">
                            <div className="text-xs text-blue-600 mb-1">Запланировано</div>
                            <div className="text-lg font-bold text-blue-900">
                              {selectedEmployeeWorkedHours.scheduledHours}ч
                            </div>
                          </div>
                          <div className="bg-white p-3 rounded">
                            <div className="text-xs text-blue-600 mb-1">Отработано</div>
                            <div className="text-lg font-bold text-green-700">
                              {selectedEmployeeWorkedHours.workedHours}ч
                            </div>
                          </div>
                        </div>

                        {(selectedEmployeeWorkedHours.substitutedHours > 0 || selectedEmployeeWorkedHours.substitutedByOthers > 0) && (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-3 rounded">
                              <div className="text-xs text-orange-600 mb-1">Замещения</div>
                              <div className="text-lg font-bold text-orange-700">
                                {selectedEmployeeWorkedHours.substitutedHours}ч
                              </div>
                            </div>
                            <div className="bg-white p-3 rounded">
                              <div className="text-xs text-red-600 mb-1">Замещено другими</div>
                              <div className="text-lg font-bold text-red-700">
                                {selectedEmployeeWorkedHours.substitutedByOthers}ч
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="border-t border-blue-300 pt-2 flex items-center justify-between">
                          <span className="text-sm font-medium text-blue-700">Эффективность:</span>
                          <span className="text-lg font-bold text-blue-900">
                            {selectedEmployeeWorkedHours.scheduledHours > 0
                              ? Math.round((selectedEmployeeWorkedHours.workedHours / selectedEmployeeWorkedHours.scheduledHours) * 100)
                              : 0}%
                          </span>
                        </div>

                        <div className="text-xs text-blue-600">
                          Период: {selectedEmployee.month}/{selectedEmployee.year}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        {workedHoursLoading ? (
                          <div className="text-blue-600">Загрузка данных о часах...</div>
                        ) : (
                          <div className="text-blue-600">Данные о часах не найдены</div>
                        )}
                      </div>
                    )}

                    {/* Кнопка принудительного пересчета часов */}
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <button
                        onClick={async () => {
                          if (!selectedEmployee?.teacher?.id) return;

                          try {
                            setWorkedHoursLoading(true);
                            await salaryService.calculateWorkedHours(
                              selectedEmployee.teacher.id,
                              selectedEmployee.month,
                              selectedEmployee.year
                            );

                            // Перезагружаем данные после пересчета
                            const workedHours = await salaryService.getWorkedHours(
                              selectedEmployee.teacher.id,
                              selectedEmployee.month,
                              selectedEmployee.year
                            );
                            setSelectedEmployeeWorkedHours(workedHours);

                            alert('Отработанные часы успешно пересчитаны!');
                          } catch (error) {
                            console.error('Ошибка при пересчете часов:', error);
                            alert('Произошла ошибка при пересчете часов');
                          } finally {
                            setWorkedHoursLoading(false);
                          }
                        }}
                        disabled={workedHoursLoading}
                        className="w-full px-3 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400 flex items-center justify-center gap-2"
                      >
                        {workedHoursLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                            Пересчет...
                          </>
                        ) : (
                          <>
                            <FaSync className="w-3 h-3" />
                            Пересчитать часы
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Надбавки</h3>
                    <div className="space-y-2">
                      {selectedEmployee.allowances?.map((allowance: any, index: number) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm">{allowance.name}</span>
                          <span className="text-purple-600 font-medium">
                            +{allowance.isPercentage ? `${allowance.amount}%` : formatCurrency(allowance.amount)}
                          </span>
                        </div>
                      ))}
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
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${selectedEmployee.status === 'PAID' ? 'bg-green-100 text-green-800' :
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

  // Загружаем ставку преподавателя при открытии модального окна
  useEffect(() => {
    const loadEmployeeRate = async () => {
      if (!selectedEmployee?.teacher?.id) return;

      try {
        setRateLoading(true);
        const rate = await salaryService.getTeacherSalaryRate(selectedEmployee.teacher.id);
        setSelectedEmployeeRate(rate);
      } catch (error) {
        console.error('Ошибка загрузки ставки преподавателя:', error);
        setSelectedEmployeeRate(null);
      } finally {
        setRateLoading(false);
      }
    };

    if (selectedEmployee) {
      loadEmployeeRate();
    } else {
      setSelectedEmployeeRate(null);
    }
  }, [selectedEmployee]);

  // Загружаем отработанные часы при открытии модального окна
  useEffect(() => {
    const loadEmployeeWorkedHours = async () => {
      if (!selectedEmployee?.teacher?.id || !selectedEmployee?.month || !selectedEmployee?.year) return;

      try {
        setWorkedHoursLoading(true);
        const workedHours = await salaryService.getWorkedHours(
          selectedEmployee.teacher.id,
          selectedEmployee.month,
          selectedEmployee.year
        );
        setSelectedEmployeeWorkedHours(workedHours);
      } catch (error) {
        console.error('Ошибка загрузки отработанных часов:', error);
        setSelectedEmployeeWorkedHours(null);
      } finally {
        setWorkedHoursLoading(false);
      }
    };

    if (selectedEmployee) {
      loadEmployeeWorkedHours();
    } else {
      setSelectedEmployeeWorkedHours(null);
    }
  }, [selectedEmployee]);

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
                        Ставка/Часы
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
    <div className="p-4 sm:p-6">
      {/* Заголовок и действия */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-3 sm:space-y-0">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Управление заработной платой</h1>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <button
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center"
            onClick={() => setShowFilterModal(true)}
          >
            <FaFilter className="mr-2" />
            Фильтры
          </button>
          <button
            className={`px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center ${isRecalculating
              ? 'bg-green-400 cursor-not-allowed'
              : 'hover:bg-green-700'
              }`}
            onClick={handleRecalculate}
            disabled={isRecalculating}
          >
            {isRecalculating ? (
              <>
                <FaSync className="mr-2 animate-spin" />
                Перерасчет...
              </>
            ) : (
              <>
                <FaCalculator className="mr-2" />
                Массовый перерасчет
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Фонд оплаты труда</div>
            <FaChartLine className="text-blue-600" />
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-2xl font-bold">{formatCurrency(stats.totalPayroll)}</div>
            <div className="text-xs sm:text-sm text-green-600 flex items-center mt-1">
              <span>к прошлому месяцу</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-xs sm:text-sm text-gray-600">Средняя зарплата</div>
            <FaUserTie className="text-blue-600" />
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-2xl font-bold">{formatCurrency(stats.avgSalary)}</div>
            <div className="text-xs sm:text-sm text-green-600 flex items-center mt-1">
              <span>+3.8% к прошлому месяцу</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-xs sm:text-sm text-gray-600">Сотрудников</div>
            <FaUsers className="text-blue-600" />
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-2xl font-bold">{stats.employeeCount}</div>
            <div className="text-xs sm:text-sm text-gray-600 flex items-center mt-1">
              <span>{departments.teaching.count} учителей</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
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

      {/* Анализ выплат */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Структура выплат</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.statusStats?.map(stat => ({
                name: stat.status === 'PAID' ? 'Выплачено' :
                  stat.status === 'APPROVED' ? 'Утверждено' :
                    stat.status === 'DRAFT' ? 'Черновик' : 'Отменено',
                amount: stat.total,
                count: stat.count,
                color: stat.status === 'PAID' ? '#10B981' :
                  stat.status === 'APPROVED' ? '#3B82F6' :
                    stat.status === 'DRAFT' ? '#F59E0B' : '#EF4444'
              })) || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    name === 'amount' ? formatCurrency(value) : value,
                    name === 'amount' ? 'Сумма' : 'Количество'
                  ]}
                  labelStyle={{ color: '#1F2937' }}
                />
                <Bar dataKey="amount" fill="#3B82F6" name="amount" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            {stats.statusStats?.map(stat => (
              <div key={stat.status} className="flex items-center justify-between">
                <span className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${stat.status === 'PAID' ? 'bg-green-500' :
                    stat.status === 'APPROVED' ? 'bg-blue-500' :
                      stat.status === 'DRAFT' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                  {stat.status === 'PAID' ? 'Выплачено' :
                    stat.status === 'APPROVED' ? 'Утверждено' :
                      stat.status === 'DRAFT' ? 'Черновик' : 'Отменено'}
                </span>
                <span className="font-medium">{stat.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Динамика ФОТ</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={(() => {
                // Генерируем данные за последние 6 месяцев на основе текущих данных
                const currentDate = new Date();
                const months = [];
                const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];

                for (let i = 5; i >= 0; i--) {
                  const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
                  const baseValue = stats.totalPayroll || 0;
                  // Добавляем небольшую вариацию для демонстрации тренда
                  const variation = (Math.random() - 0.5) * 0.2 + (i * 0.05); // Небольшой рост со временем

                  months.push({
                    month: monthNames[date.getMonth()],
                    value: Math.max(0, baseValue + (baseValue * variation)),
                    year: date.getFullYear()
                  });
                }

                return months;
              })()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}М`} />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), 'ФОТ']}
                  labelStyle={{ color: '#1F2937' }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>Текущий ФОТ: {formatCurrency(stats.totalPayroll)}</span>
            <span className="text-green-600">
              {stats.totalPayroll > 0 ? '+5.2%' : 'Нет данных'} к прошлому месяцу
            </span>
          </div>
        </div>
      </div>

      {/* Таблица зарплат */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800">Список зарплат</h2>
        </div>
        
        {/* Мобильная версия - карточки */}
        <div className="block sm:hidden">
          {filteredSalaries.map((salary, index) => (
            <div key={index} className="p-4 border-b border-gray-200 last:border-b-0">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {salary.teacher?.user.surname} {salary.teacher?.user.name}
                  </h3>
                  <p className="text-xs text-gray-500 truncate">{salary.teacher?.user.email}</p>
                </div>
                <div className="ml-2 flex-shrink-0">
                  {getStatusBadge(salary.status!)}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                <div>
                  <span className="text-gray-600">Период:</span>
                  <span className="ml-1 font-medium">{salary.month}/{salary.year}</span>
                </div>
                <div>
                  <span className="text-gray-600">К выплате:</span>
                  <span className="ml-1 font-medium text-blue-600">{formatCurrency(salary.totalNet!)}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600">Ставка:</span>
                  <span className="ml-1 font-medium">{formatCurrency(salary.hourlyRate || 0)}/ч</span>
                  <span className="ml-2 text-xs text-gray-500">
                    ({salary.hoursWorked || 0}ч)
                  </span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setSelectedSalaryForBreakdown(salary.id!);
                    setShowCalculationBreakdown(true);
                  }}
                  className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200 transition-colors"
                >
                  Подробности
                </button>
                
                <button
                  onClick={() => handleEditAdjustments(salary)}
                  className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium hover:bg-purple-200 transition-colors"
                >
                  Корректировки
                </button>

                {salary.status === 'DRAFT' && (
                  <button
                    onClick={() => handleApproveSalary(salary.id!)}
                    className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200 transition-colors"
                  >
                    Утвердить
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Десктопная версия - таблица */}
        <div className="hidden sm:block overflow-x-auto">
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
                    <div className="text-sm text-gray-900">
                      {formatCurrency(salary.hourlyRate || 0)}/ч
                    </div>
                    <div className="text-xs text-gray-500">
                      {salary.hoursWorked || 0}ч = {formatCurrency((salary.hourlyRate || 0) * (salary.hoursWorked || 0))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{formatCurrency(salary.totalNet!)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(salary.status!)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => {
                          setSelectedSalaryForBreakdown(salary.id!);
                          setShowCalculationBreakdown(true);
                        }}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200 transition-colors"
                        title="Подробности расчета"
                      >
                        Подробности
                      </button>
                      
                      <button
                        onClick={() => handleEditAdjustments(salary)}
                        className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium hover:bg-purple-200 transition-colors"
                        title="Добавить удержания/надбавки"
                      >
                        Корректировки
                      </button>

                      {salary.status === 'DRAFT' && (
                        <button
                          onClick={() => handleApproveSalary(salary.id!)}
                          className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200 transition-colors"
                          title="Утвердить зарплату"
                        >
                          Утвердить
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

      {/* Форма управления ставками преподавателей */}
      <TeacherSalaryRateForm
        isOpen={showSalaryRateForm}
        onClose={() => {
          setShowSalaryRateForm(false);
          setSelectedTeacherForRate(null);
          setCurrentTeacherRate(null);
        }}
        onSubmit={handleSubmitTeacherRate}
        teacherId={selectedTeacherForRate?.id || 0}
        teacherName={selectedTeacherForRate ? `${selectedTeacherForRate.user?.surname} ${selectedTeacherForRate.user?.name}` : ''}
        currentRate={currentTeacherRate}
        isLoading={loading}
      />

      {/* Модальное окно редактирования корректировок */}
      <SalaryAdjustmentsModal
        isOpen={showAdjustmentsModal}
        onClose={() => {
          setShowAdjustmentsModal(false);
          setSelectedSalaryForAdjustments(null);
        }}
        onSubmit={handleSubmitAdjustments}
        salary={selectedSalaryForAdjustments}
        isLoading={loading}
      />

      {/* Модальное окно детального расчета зарплаты */}
      {selectedSalaryForBreakdown && (
        <SalaryCalculationBreakdown
          salaryId={selectedSalaryForBreakdown}
          isOpen={showCalculationBreakdown}
          onClose={() => {
            setShowCalculationBreakdown(false);
            setSelectedSalaryForBreakdown(null);
          }}
        />
      )}
    </div>
  );
};

export default Salaries;
