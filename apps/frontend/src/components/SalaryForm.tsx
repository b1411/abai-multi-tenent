import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaPlus, 
  FaTrash, 
  FaCalculator, 
  FaTimes,
  FaUser,
  FaCalendar,
  FaClock,
  FaCoins,
  FaGift,
  FaMinus,
  FaStar,
  FaPercentage
} from 'react-icons/fa';
import { X, Calculator, Clock, User, Calendar, Coins } from 'lucide-react';
import { CreateSalaryDto, BonusType, AllowanceType, Salary } from '../types/salary';
import { Teacher } from '../types/teacher';
import { formatCurrency } from '../utils/formatters';
import { Input } from './ui/Input';
import { Modal } from './ui/Modal';
import { salaryPDFService } from '../services/salaryPDFService';
import { salaryService } from '../services/salaryService';
import { FaDownload } from 'react-icons/fa';

interface SalaryFormData extends Omit<CreateSalaryDto, 'hourlyRate' | 'hoursWorked'> {
  hourlyRate: string | number;
  hoursWorked: string | number;
}

interface SalaryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateSalaryDto) => void;
  teachers: Teacher[];
  editingSalary?: Salary | null;
  isLoading?: boolean;
}

const SalaryForm: React.FC<SalaryFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  teachers,
  editingSalary,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<SalaryFormData>({
    teacherId: 0,
    hourlyRate: '',
    hoursWorked: '',
    allowances: [],
    bonuses: [],
    deductions: [],
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    comment: ''
  });

  const [calculatedTotals, setCalculatedTotals] = useState({
    baseSalary: 0,
    totalAllowances: 0,
    totalBonuses: 0,
    totalDeductions: 0,
    totalGross: 0,
    totalNet: 0
  });

  // Инициализация формы при редактировании
  useEffect(() => {
    if (editingSalary) {
      setFormData({
        teacherId: editingSalary.teacherId,
        hourlyRate: editingSalary.hourlyRate || '',
        hoursWorked: editingSalary.hoursWorked || '',
        allowances: editingSalary.allowances?.map(a => ({
          type: a.type,
          name: a.name,
          amount: a.amount,
          isPercentage: a.isPercentage,
          comment: a.comment
        })) || [],
        bonuses: editingSalary.bonuses?.map(b => ({
          type: b.type,
          name: b.name,
          amount: b.amount,
          isPercentage: b.isPercentage || false,
          comment: b.comment
        })) || [],
        deductions: editingSalary.deductions?.map(d => ({
          name: d.name,
          amount: d.amount,
          isPercentage: d.isPercentage || false,
          comment: d.comment
        })) || [],
        month: editingSalary.month,
        year: editingSalary.year,
        comment: editingSalary.comment || ''
      });
    } else {
      // Сброс формы для создания новой зарплаты
      setFormData({
        teacherId: 0,
        hourlyRate: '',
        hoursWorked: '',
        allowances: [],
        bonuses: [],
        deductions: [],
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        comment: ''
      });
    }
  }, [editingSalary, isOpen]);

  // Пересчет итогов при изменении данных
  useEffect(() => {
    const hourlyRate = typeof formData.hourlyRate === 'string' ? (parseFloat(formData.hourlyRate) || 0) : formData.hourlyRate;
    const hoursWorked = typeof formData.hoursWorked === 'string' ? (parseFloat(formData.hoursWorked) || 0) : formData.hoursWorked;
    const baseSalary = hourlyRate * hoursWorked;

    const totalAllowances = formData.allowances?.reduce((sum, allowance) => {
      if (allowance.isPercentage) {
        return sum + (baseSalary * allowance.amount / 100);
      }
      return sum + allowance.amount;
    }, 0) || 0;

    const totalBonuses = formData.bonuses?.reduce((sum, bonus) => {
      if (bonus.isPercentage) {
        return sum + (baseSalary * bonus.amount / 100);
      }
      return sum + bonus.amount;
    }, 0) || 0;

    const totalDeductions = formData.deductions?.reduce((sum, deduction) => {
      if (deduction.isPercentage) {
        return sum + (baseSalary * deduction.amount / 100);
      }
      return sum + deduction.amount;
    }, 0) || 0;
    const totalGross = baseSalary + totalAllowances + totalBonuses;
    const totalNet = totalGross - totalDeductions;

    setCalculatedTotals({
      baseSalary,
      totalAllowances,
      totalBonuses,
      totalDeductions,
      totalGross,
      totalNet
    });
  }, [formData]);

  const handleInputChange = (field: keyof SalaryFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Функция для загрузки ставки преподавателя
  const loadTeacherRate = async () => {
    if (!formData.teacherId) {
      alert('Сначала выберите преподавателя');
      return;
    }

    console.log(`[SalaryForm] Загружаем ставку для преподавателя ID: ${formData.teacherId}`);

    try {
      const teacherRate = await salaryService.getTeacherSalaryRate(formData.teacherId);
      console.log('[SalaryForm] Получены данные о ставке:', teacherRate);
      
      if (teacherRate && teacherRate.totalRate) {
        handleInputChange('hourlyRate', teacherRate.totalRate);
        console.log(`[SalaryForm] Ставка установлена: ${teacherRate.totalRate}`);
        
        alert(`Ставка загружена: ${formatCurrency(teacherRate.totalRate)}/час (включая все факторы)`);
      } else {
        console.log('[SalaryForm] Ставка не найдена или пустая:', teacherRate);
        alert('У преподавателя не настроена ставка. Перейдите в профиль преподавателя для настройки ставки.');
      }
    } catch (error) {
      console.error('[SalaryForm] Ошибка при загрузке ставки:', error);
      alert(`Ошибка при загрузке ставки преподавателя: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  };

  // Функция для загрузки отработанных часов
  const loadWorkedHours = async () => {
    if (!formData.teacherId) {
      alert('Сначала выберите преподавателя');
      return;
    }

    console.log(`[SalaryForm] Загружаем отработанные часы для преподавателя ID: ${formData.teacherId}, месяц: ${formData.month}, год: ${formData.year}`);

    try {
      const workedHoursData = await salaryService.getWorkedHours(
        formData.teacherId, 
        formData.month, 
        formData.year
      );
      
      console.log('[SalaryForm] Полученные данные отработанных часов:', workedHoursData);
      
      if (workedHoursData) {
        // Backend возвращает объект TeacherWorkedHours напрямую
        const totalWorkedHours = workedHoursData.workedHours || 0;
        const scheduledHours = workedHoursData.scheduledHours || 0;
        const substitutedHours = workedHoursData.substitutedHours || 0;
        const substitutedByOthers = workedHoursData.substitutedByOthers || 0;
        
        console.log(`[SalaryForm] Разбор данных:`);
        console.log(`  - totalWorkedHours: ${totalWorkedHours}`);
        console.log(`  - scheduledHours: ${scheduledHours}`);
        console.log(`  - substitutedHours: ${substitutedHours}`);
        console.log(`  - substitutedByOthers: ${substitutedByOthers}`);
        
        // Используем фактически отработанные часы (включая замещения)
        const hoursToUse = totalWorkedHours + substitutedHours;
        
        console.log(`[SalaryForm] Итого часов к использованию: ${hoursToUse}`);
        
        handleInputChange('hoursWorked', hoursToUse);
        
        alert(`Часы загружены: ${hoursToUse} часов\n` +
              `Детали:\n` +
              `• Основные часы: ${totalWorkedHours}\n` +
              `• Замещения: ${substitutedHours}\n` +
              `• Замещено другими: ${substitutedByOthers}\n` +
              `• Запланировано: ${scheduledHours}`);
      } else {
        // Если нет данных, пытаемся рассчитать часы
        console.log('[SalaryForm] Данные не найдены, пытаемся рассчитать часы...');
        const calculatedHours = await salaryService.calculateWorkedHours(
          formData.teacherId,
          formData.month,
          formData.year
        );
        
        console.log('[SalaryForm] Рассчитанные часы:', calculatedHours);
        
        if (calculatedHours) {
          const totalCalculatedHours = (calculatedHours.workedHours || 0) + (calculatedHours.substitutedHours || 0);
          console.log(`[SalaryForm] Итого рассчитанных часов: ${totalCalculatedHours}`);
          
          handleInputChange('hoursWorked', totalCalculatedHours);
          alert(`Часы рассчитаны из расписания: ${totalCalculatedHours} часов\n` +
                `Детали:\n` +
                `• Основные часы: ${calculatedHours.workedHours || 0}\n` +
                `• Замещения: ${calculatedHours.substitutedHours || 0}\n` +
                `• Замещено другими: ${calculatedHours.substitutedByOthers || 0}\n` +
                `• Запланировано: ${calculatedHours.scheduledHours || 0}`);
        } else {
          console.log('[SalaryForm] Рассчитанные данные тоже пусты');
          alert('Не удалось найти данные о расписании для выбранного периода');
        }
      }
    } catch (error) {
      console.error('[SalaryForm] Ошибка при загрузке часов:', error);
      alert(`Ошибка при загрузке отработанных часов: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  };

  // Функции для работы с надбавками
  const addAllowance = () => {
    setFormData(prev => ({
      ...prev,
      allowances: [
        ...(prev.allowances || []),
        {
          type: AllowanceType.OTHER,
          name: '',
          amount: 0,
          isPercentage: false,
          comment: ''
        }
      ]
    }));
  };

  const removeAllowance = (index: number) => {
    setFormData(prev => ({
      ...prev,
      allowances: prev.allowances?.filter((_, i) => i !== index) || []
    }));
  };

  const updateAllowance = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      allowances: prev.allowances?.map((allowance, i) => 
        i === index ? { ...allowance, [field]: value } : allowance
      ) || []
    }));
  };

  // Функции для работы с бонусами
  const addBonus = () => {
    setFormData(prev => ({
      ...prev,
      bonuses: [
        ...(prev.bonuses || []),
        {
          type: BonusType.OTHER,
          name: '',
          amount: 0,
          isPercentage: false,
          comment: ''
        }
      ]
    }));
  };

  const removeBonus = (index: number) => {
    setFormData(prev => ({
      ...prev,
      bonuses: prev.bonuses?.filter((_, i) => i !== index) || []
    }));
  };

  const updateBonus = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      bonuses: prev.bonuses?.map((bonus, i) => 
        i === index ? { ...bonus, [field]: value } : bonus
      ) || []
    }));
  };

  // Функции для работы с удержаниями
  const addDeduction = () => {
    setFormData(prev => ({
      ...prev,
      deductions: [
        ...(prev.deductions || []),
        {
          name: '',
          amount: 0,
          isPercentage: false,
          comment: ''
        }
      ]
    }));
  };

  const removeDeduction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      deductions: prev.deductions?.filter((_, i) => i !== index) || []
    }));
  };

  const updateDeduction = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      deductions: prev.deductions?.map((deduction, i) => 
        i === index ? { ...deduction, [field]: value } : deduction
      ) || []
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hourlyRate = typeof formData.hourlyRate === 'string' ? (parseFloat(formData.hourlyRate) || 0) : formData.hourlyRate;
    const hoursWorked = typeof formData.hoursWorked === 'string' ? (parseFloat(formData.hoursWorked) || 0) : formData.hoursWorked;
    
    if (formData.teacherId && hourlyRate >= 0 && hoursWorked >= 0) {
      // Сначала сохраняем данные
      onSubmit({
        ...formData,
        hourlyRate: hourlyRate,
        hoursWorked: hoursWorked
      });
      
      // Затем генерируем PDF
      handleGeneratePDF();
    }
  };

  const handleGeneratePDF = async () => {
    console.log('Начинаем генерацию PDF...');
    
    if (!formData.teacherId || !formData.hourlyRate || !formData.hoursWorked) {
      alert('Пожалуйста, заполните основные данные для генерации PDF');
      return;
    }

    // Находим выбранного преподавателя
    const selectedTeacher = teachers.find(t => t.id === formData.teacherId);
    if (!selectedTeacher) {
      alert('Преподаватель не найден');
      return;
    }

    console.log('Найден преподаватель:', selectedTeacher);

    try {
      // Создаем временный объект Salary для PDF
      const hourlyRate = typeof formData.hourlyRate === 'string' ? (parseFloat(formData.hourlyRate) || 0) : formData.hourlyRate;
      const hoursWorked = typeof formData.hoursWorked === 'string' ? (parseFloat(formData.hoursWorked) || 0) : formData.hoursWorked;

      const tempSalary: Salary = {
        id: editingSalary?.id || 0,
        teacherId: formData.teacherId,
        teacher: selectedTeacher,
        hourlyRate: hourlyRate,
        hoursWorked: hoursWorked,
        baseSalary: calculatedTotals.baseSalary,
        allowances: formData.allowances?.map((a, index) => ({
          id: index,
          type: a.type,
          name: a.name,
          amount: a.amount,
          isPercentage: a.isPercentage || false,
          comment: a.comment,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })) || [],
        bonuses: formData.bonuses?.map((b, index) => ({
          id: index,
          type: b.type,
          name: b.name,
          amount: b.amount,
          isPercentage: b.isPercentage || false,
          comment: b.comment,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })) || [],
        deductions: formData.deductions?.map((d, index) => ({
          id: index,
          name: d.name,
          amount: d.amount,
          isPercentage: d.isPercentage || false,
          comment: d.comment,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })) || [],
        totalGross: calculatedTotals.totalGross,
        totalNet: calculatedTotals.totalNet,
        month: formData.month,
        year: formData.year,
        status: editingSalary?.status || 'DRAFT' as any,
        comment: formData.comment,
        createdAt: editingSalary?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('Создан объект зарплаты для PDF:', tempSalary);

      // Генерируем PDF асинхронно
      console.log('Вызываем salaryPDFService.generateSalarySlip...');
      await salaryPDFService.generateSalarySlip(tempSalary);
      console.log('PDF генерация завершена');
      
    } catch (error) {
      console.error('Ошибка при генерации PDF в handleGeneratePDF:', error);
      alert(`Ошибка при создании PDF: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  };

  const getAllowanceTypeLabel = (type: AllowanceType) => {
    switch (type) {
      case AllowanceType.EXPERIENCE:
        return 'За стаж';
      case AllowanceType.CATEGORY:
        return 'За категорию';
      case AllowanceType.CONDITIONS:
        return 'За условия труда';
      case AllowanceType.QUALIFICATION:
        return 'За квалификацию';
      case AllowanceType.OTHER:
        return 'Прочие';
      default:
        return type;
    }
  };

  const getBonusTypeLabel = (type: BonusType) => {
    switch (type) {
      case BonusType.PERFORMANCE:
        return 'За результативность';
      case BonusType.ACHIEVEMENT:
        return 'За достижения';
      case BonusType.OVERTIME:
        return 'За переработки';
      case BonusType.HOLIDAY:
        return 'Праздничные';
      case BonusType.OTHER:
        return 'Прочие';
      default:
        return type;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden"
      >
        {/* Заголовок */}
        <div className="bg-gradient-to-r from-[#ca181f] to-red-700 p-6 -m-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center">
              <Calculator className="mr-3 h-6 w-6" />
              {editingSalary ? 'Редактировать зарплату' : 'Расчет зарплаты'}
            </h2>
            <button 
              type="button"
              onClick={onClose}
              className="text-white hover:text-gray-200 p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6">
          <div className="space-y-8 pb-6">
            {/* Основная информация */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
                <User className="mr-2 h-5 w-5 text-[#ca181f]" />
                Основная информация
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Выбор сотрудника */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Сотрудник *
                  </label>
                  <select
                    value={formData.teacherId}
                    onChange={(e) => handleInputChange('teacherId', parseInt(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#ca181f]/20 focus:border-[#ca181f] transition-all duration-200"
                    required
                  >
                    <option value={0}>Выберите сотрудника</option>
                    {teachers.map(teacher => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.user.surname} {teacher.user.name} {teacher.user.middlename}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Период */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Месяц *
                    </label>
                    <select
                      value={formData.month}
                      onChange={(e) => handleInputChange('month', parseInt(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#ca181f]/20 focus:border-[#ca181f] transition-all duration-200"
                      required
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {new Date(2024, i).toLocaleDateString('ru', { month: 'long' })}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Год *
                    </label>
                    <input
                      type="number"
                      value={formData.year}
                      onChange={(e) => handleInputChange('year', e.target.value === '' ? new Date().getFullYear() : parseInt(e.target.value) || new Date().getFullYear())}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#ca181f]/20 focus:border-[#ca181f] transition-all duration-200"
                      min="2020"
                      max="2030"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Расчет базовой зарплаты */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border-l-4 border-blue-500 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
                <Calculator className="mr-2 h-5 w-5 text-blue-600" />
                Расчет базовой зарплаты
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ставка за час (₸) *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={formData.hourlyRate}
                      onChange={(e) => handleInputChange('hourlyRate', e.target.value)}
                      placeholder="15000"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#ca181f]/20 focus:border-[#ca181f] transition-all duration-200"
                      required
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={loadTeacherRate}
                      disabled={!formData.teacherId}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Загрузить ставку преподавателя"
                    >
                      <FaUser className="w-4 h-4 mr-2" />
                      Ставка
                    </motion.button>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Нажмите "Ставка" для загрузки настроенной ставки преподавателя
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Отработано часов *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={formData.hoursWorked}
                      onChange={(e) => handleInputChange('hoursWorked', e.target.value)}
                      placeholder="120"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#ca181f]/20 focus:border-[#ca181f] transition-all duration-200"
                      required
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={loadWorkedHours}
                      disabled={!formData.teacherId}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Загрузить часы из расписания"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Импорт
                    </motion.button>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Нажмите "Импорт" для автоматической загрузки часов из расписания
                  </div>
                </div>
              </div>

              {/* Результат расчета */}
              <motion.div
                animate={{ scale: calculatedTotals.baseSalary > 0 ? [1, 1.02, 1] : 1 }}
                transition={{ duration: 0.3 }}
                className="bg-gradient-to-r from-white to-blue-50 p-6 rounded-xl border-2 border-blue-300 shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="bg-blue-600 p-2 rounded-lg mr-3">
                      <FaCalculator className="text-white h-5 w-5" />
                    </div>
                    <span className="text-lg font-medium text-gray-700">Базовая зарплата:</span>
                  </div>
                  <span className="text-3xl font-bold text-blue-600">
                    {formatCurrency(calculatedTotals.baseSalary)}
                  </span>
                </div>
                <div className="text-sm text-gray-500 mt-2 flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {typeof formData.hourlyRate === 'string' ? (parseFloat(formData.hourlyRate) || 0) : formData.hourlyRate} ₸/час × {typeof formData.hoursWorked === 'string' ? (parseFloat(formData.hoursWorked) || 0) : formData.hoursWorked} часов
                </div>
              </motion.div>
            </div>

            {/* Надбавки */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <FaStar className="mr-2 text-purple-600" />
                  Надбавки
                </h3>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={addAllowance}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center text-sm"
                >
                  <FaPlus className="mr-2" />
                  Добавить надбавку
                </motion.button>
              </div>
              
              <AnimatePresence>
                {formData.allowances?.map((allowance, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white p-4 rounded-lg mb-3 border border-purple-200"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Тип надбавки</label>
                        <select
                          value={allowance.type}
                          onChange={(e) => updateAllowance(index, 'type', e.target.value as AllowanceType)}
                          className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                        >
                          {Object.values(AllowanceType).map(type => (
                            <option key={type} value={type}>
                              {getAllowanceTypeLabel(type)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                        <input
                          type="text"
                          value={allowance.name}
                          onChange={(e) => updateAllowance(index, 'name', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                          placeholder="Название надбавки"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Сумма {allowance.isPercentage ? '(%)' : '(₸)'}
                        </label>
                        <div className="flex">
                          <input
                            type="number"
                            value={allowance.amount}
                            onChange={(e) => updateAllowance(index, 'amount', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                            className="flex-1 border border-gray-300 rounded-l-md px-2 py-1 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                          />
                          <button
                            type="button"
                            onClick={() => updateAllowance(index, 'isPercentage', !allowance.isPercentage)}
                            className={`px-2 py-1 border-l-0 border border-gray-300 rounded-r-md text-xs ${
                              allowance.isPercentage 
                                ? 'bg-purple-100 text-purple-700' 
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            %
                          </button>
                        </div>
                      </div>
                      <div className="flex items-end">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          type="button"
                          onClick={() => removeAllowance(index)}
                          className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                        >
                          <FaTrash />
                        </motion.button>
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Комментарий</label>
                      <input
                        type="text"
                        value={allowance.comment || ''}
                        onChange={(e) => updateAllowance(index, 'comment', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                        placeholder="Комментарий к надбавке"
                      />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {formData.allowances?.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FaStar className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p>Надбавки не добавлены</p>
                </div>
              )}
            </div>

            {/* Бонусы */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <FaGift className="mr-2 text-green-600" />
                  Бонусы и премии
                </h3>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={addBonus}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center text-sm"
                >
                  <FaPlus className="mr-2" />
                  Добавить бонус
                </motion.button>
              </div>
              
              <AnimatePresence>
                {formData.bonuses?.map((bonus, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white p-4 rounded-lg mb-3 border border-green-200"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Тип</label>
                        <select
                          value={bonus.type}
                          onChange={(e) => updateBonus(index, 'type', e.target.value as BonusType)}
                          className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                        >
                          {Object.values(BonusType).map(type => (
                            <option key={type} value={type}>
                              {getBonusTypeLabel(type)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                        <input
                          type="text"
                          value={bonus.name}
                          onChange={(e) => updateBonus(index, 'name', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                          placeholder="Название бонуса"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Сумма {bonus.isPercentage ? '(%)' : '(₸)'}
                        </label>
                        <div className="flex">
                          <input
                            type="number"
                            value={bonus.amount}
                            onChange={(e) => updateBonus(index, 'amount', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                            className="flex-1 border border-gray-300 rounded-l-md px-2 py-1 text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                          />
                          <button
                            type="button"
                            onClick={() => updateBonus(index, 'isPercentage', !bonus.isPercentage)}
                            className={`px-2 py-1 border-l-0 border border-gray-300 rounded-r-md text-xs ${
                              bonus.isPercentage 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            %
                          </button>
                        </div>
                      </div>
                      <div className="flex items-end">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          type="button"
                          onClick={() => removeBonus(index)}
                          className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                        >
                          <FaTrash />
                        </motion.button>
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Комментарий</label>
                      <input
                        type="text"
                        value={bonus.comment || ''}
                        onChange={(e) => updateBonus(index, 'comment', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                        placeholder="Комментарий к бонусу"
                      />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {formData.bonuses?.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FaGift className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p>Бонусы не добавлены</p>
                </div>
              )}
            </div>

            {/* Удержания */}
            <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border border-red-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <FaMinus className="mr-2 text-red-600" />
                  Удержания
                </h3>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={addDeduction}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center text-sm"
                >
                  <FaPlus className="mr-2" />
                  Добавить удержание
                </motion.button>
              </div>
              
              <AnimatePresence>
                {formData.deductions?.map((deduction, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white p-4 rounded-lg mb-3 border border-red-200"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                        <input
                          type="text"
                          value={deduction.name}
                          onChange={(e) => updateDeduction(index, 'name', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                          placeholder="Название удержания"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Сумма {deduction.isPercentage ? '(%)' : '(₸)'}
                        </label>
                        <div className="flex">
                          <input
                            type="number"
                            value={deduction.amount}
                            onChange={(e) => updateDeduction(index, 'amount', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                            className="flex-1 border border-gray-300 rounded-l-md px-2 py-1 text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                          />
                          <button
                            type="button"
                            onClick={() => updateDeduction(index, 'isPercentage', !deduction.isPercentage)}
                            className={`px-2 py-1 border-l-0 border border-gray-300 rounded-r-md text-xs ${
                              deduction.isPercentage 
                                ? 'bg-red-100 text-red-700' 
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            %
                          </button>
                        </div>
                      </div>
                      <div></div>
                      <div className="flex items-end">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          type="button"
                          onClick={() => removeDeduction(index)}
                          className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                        >
                          <FaTrash />
                        </motion.button>
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Комментарий</label>
                      <input
                        type="text"
                        value={deduction.comment || ''}
                        onChange={(e) => updateDeduction(index, 'comment', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                        placeholder="Комментарий к удержанию"
                      />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {formData.deductions?.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FaMinus className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p>Удержания не добавлены</p>
                </div>
              )}
            </div>

            {/* Итоговый расчет */}
            <motion.div
              animate={{ scale: calculatedTotals.totalNet > 0 ? [1, 1.01, 1] : 1 }}
              transition={{ duration: 0.4 }}
              className="bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-6 rounded-xl border-2 border-gray-300 shadow-lg"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <div className="bg-[#ca181f] p-2 rounded-lg mr-3">
                  <FaCalculator className="text-white h-5 w-5" />
                </div>
                Итоговый расчет
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-white to-gray-50 p-4 rounded-lg border-2 border-gray-200 shadow-md"
                >
                  <div className="text-sm text-gray-600 mb-1 flex items-center">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                    Базовая зарплата
                  </div>
                  <div className="text-lg font-bold text-gray-900">{formatCurrency(calculatedTotals.baseSalary)}</div>
                </motion.div>
                
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-white to-purple-50 p-4 rounded-lg border-2 border-purple-200 shadow-md"
                >
                  <div className="text-sm text-gray-600 mb-1 flex items-center">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mr-2"></div>
                    Надбавки
                  </div>
                  <div className="text-lg font-bold text-purple-600">+{formatCurrency(calculatedTotals.totalAllowances)}</div>
                </motion.div>
                
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-white to-green-50 p-4 rounded-lg border-2 border-green-200 shadow-md"
                >
                  <div className="text-sm text-gray-600 mb-1 flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                    Премии
                  </div>
                  <div className="text-lg font-bold text-green-600">+{formatCurrency(calculatedTotals.totalBonuses)}</div>
                </motion.div>
                
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-white to-red-50 p-4 rounded-lg border-2 border-red-200 shadow-md"
                >
                  <div className="text-sm text-gray-600 mb-1 flex items-center">
                    <div className="w-2 h-2 bg-red-400 rounded-full mr-2"></div>
                    Удержания
                  </div>
                  <div className="text-lg font-bold text-red-600">-{formatCurrency(calculatedTotals.totalDeductions)}</div>
                </motion.div>
                
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  animate={{ 
                    boxShadow: calculatedTotals.totalNet > 0 
                      ? ["0 4px 6px -1px rgba(0, 0, 0, 0.1)", "0 10px 15px -3px rgba(202, 24, 31, 0.3)", "0 4px 6px -1px rgba(0, 0, 0, 0.1)"]
                      : "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="bg-gradient-to-br from-[#ca181f] to-red-700 p-6 rounded-lg text-white shadow-xl border-2 border-red-300"
                >
                  <div className="text-sm text-red-100 mb-2 flex items-center font-medium">
                    <FaCoins className="mr-2" />
                    К ВЫПЛАТЕ
                  </div>
                  <div className="text-2xl font-bold">{formatCurrency(calculatedTotals.totalNet)}</div>
                </motion.div>
              </div>
            </motion.div>

            {/* Комментарий */}
            <div>
              <Input
                label="Комментарий"
                value={formData.comment || ''}
                onChange={(e) => handleInputChange('comment', e.target.value)}
                placeholder="Дополнительные комментарии к зарплате..."
              />
            </div>
          </div>

          {/* Кнопки управления */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t-2 border-gray-200 bg-gray-50 -mx-6 px-6 rounded-b-2xl">
            <div className="flex space-x-3">
              {calculatedTotals.totalNet > 0 && formData.teacherId && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleGeneratePDF}
                  className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center font-medium"
                  title="Скачать расчетный лист в PDF"
                >
                  <FaDownload className="mr-2" />
                  PDF
                </motion.button>
              )}
            </div>
            
            <div className="flex space-x-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Отмена
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading || !formData.teacherId || !formData.hourlyRate || !formData.hoursWorked}
                className="px-6 py-3 bg-[#ca181f] text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center font-medium"
              >
                {isLoading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="rounded-full h-4 w-4 border-b-2 border-white mr-2"
                    />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <FaCalculator className="mr-2" />
                    {editingSalary ? 'Обновить' : 'Рассчитать'}
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default SalaryForm;
