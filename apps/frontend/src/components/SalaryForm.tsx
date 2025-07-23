import React, { useState, useEffect } from 'react';
import { 
  FaPlus, 
  FaTrash, 
  FaCalculator, 
  FaTimes,
  FaUser,
  FaCalendar,
  FaDollarSign,
  FaGift,
  FaMinus
} from 'react-icons/fa';
import { CreateSalaryDto, BonusType, Salary } from '../types/salary';
import { Teacher } from '../types/teacher';
import { formatCurrency } from '../utils/formatters';

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
  const [formData, setFormData] = useState<CreateSalaryDto>({
    teacherId: 0,
    baseSalary: 0,
    bonuses: [],
    deductions: [],
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    comment: ''
  });

  const [calculatedTotals, setCalculatedTotals] = useState({
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
        baseSalary: editingSalary.baseSalary,
        bonuses: editingSalary.bonuses?.map(b => ({
          type: b.type,
          name: b.name,
          amount: b.amount,
          comment: b.comment
        })) || [],
        deductions: editingSalary.deductions?.map(d => ({
          name: d.name,
          amount: d.amount,
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
        baseSalary: 0,
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
    const totalBonuses = formData.bonuses?.reduce((sum, bonus) => sum + bonus.amount, 0) || 0;
    const totalDeductions = formData.deductions?.reduce((sum, deduction) => sum + deduction.amount, 0) || 0;
    const totalGross = formData.baseSalary + totalBonuses;
    const totalNet = totalGross - totalDeductions;

    setCalculatedTotals({
      totalBonuses,
      totalDeductions,
      totalGross,
      totalNet
    });
  }, [formData]);

  const handleInputChange = (field: keyof CreateSalaryDto, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addBonus = () => {
    setFormData(prev => ({
      ...prev,
      bonuses: [
        ...(prev.bonuses || []),
        {
          type: BonusType.OTHER,
          name: '',
          amount: 0,
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

  const addDeduction = () => {
    setFormData(prev => ({
      ...prev,
      deductions: [
        ...(prev.deductions || []),
        {
          name: '',
          amount: 0,
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
    if (formData.teacherId && formData.baseSalary >= 0) {
      onSubmit(formData);
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
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Шапка */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 rounded-t-xl text-white">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center">
                <FaDollarSign className="mr-3" />
                {editingSalary ? 'Редактировать зарплату' : 'Создать зарплату'}
              </h2>
              <button 
                type="button"
                onClick={onClose}
                className="text-white hover:text-gray-200 text-2xl"
              >
                <FaTimes />
              </button>
            </div>
          </div>

          {/* Основная информация */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Выбор сотрудника */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaUser className="inline mr-2" />
                  Сотрудник *
                </label>
                <select
                  value={formData.teacherId}
                  onChange={(e) => handleInputChange('teacherId', parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

              {/* Базовая зарплата */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaDollarSign className="inline mr-2" />
                  Базовая зарплата *
                </label>
                <input
                  type="number"
                  value={formData.baseSalary}
                  onChange={(e) => handleInputChange('baseSalary', parseInt(e.target.value) || 0)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  required
                />
              </div>

              {/* Месяц */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaCalendar className="inline mr-2" />
                  Месяц *
                </label>
                <select
                  value={formData.month}
                  onChange={(e) => handleInputChange('month', parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(2024, i).toLocaleDateString('ru', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>

              {/* Год */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaCalendar className="inline mr-2" />
                  Год *
                </label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) => handleInputChange('year', parseInt(e.target.value) || new Date().getFullYear())}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="2020"
                  max="2030"
                  required
                />
              </div>
            </div>

            {/* Бонусы */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <FaGift className="mr-2 text-green-600" />
                  Бонусы и премии
                </h3>
                <button
                  type="button"
                  onClick={addBonus}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                >
                  <FaPlus className="mr-2" />
                  Добавить бонус
                </button>
              </div>
              
              {formData.bonuses?.map((bonus, index) => (
                <div key={index} className="bg-green-50 p-4 rounded-lg mb-3 border border-green-200">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Тип</label>
                      <select
                        value={bonus.type}
                        onChange={(e) => updateBonus(index, 'type', e.target.value as BonusType)}
                        className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
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
                        className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                        placeholder="Название бонуса"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Сумма</label>
                      <input
                        type="number"
                        value={bonus.amount}
                        onChange={(e) => updateBonus(index, 'amount', parseInt(e.target.value) || 0)}
                        className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                        min="0"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeBonus(index)}
                        className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Комментарий</label>
                    <input
                      type="text"
                      value={bonus.comment || ''}
                      onChange={(e) => updateBonus(index, 'comment', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                      placeholder="Комментарий к бонусу"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Удержания */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <FaMinus className="mr-2 text-red-600" />
                  Удержания
                </h3>
                <button
                  type="button"
                  onClick={addDeduction}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                >
                  <FaPlus className="mr-2" />
                  Добавить удержание
                </button>
              </div>
              
              {formData.deductions?.map((deduction, index) => (
                <div key={index} className="bg-red-50 p-4 rounded-lg mb-3 border border-red-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                      <input
                        type="text"
                        value={deduction.name}
                        onChange={(e) => updateDeduction(index, 'name', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                        placeholder="Название удержания"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Сумма</label>
                      <input
                        type="number"
                        value={deduction.amount}
                        onChange={(e) => updateDeduction(index, 'amount', parseInt(e.target.value) || 0)}
                        className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                        min="0"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeDeduction(index)}
                        className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Комментарий</label>
                    <input
                      type="text"
                      value={deduction.comment || ''}
                      onChange={(e) => updateDeduction(index, 'comment', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                      placeholder="Комментарий к удержанию"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Расчеты */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <FaCalculator className="mr-2 text-blue-600" />
                Расчет зарплаты
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-3 rounded-lg border">
                  <div className="text-sm text-gray-600">Базовая зарплата</div>
                  <div className="text-lg font-bold text-gray-900">{formatCurrency(formData.baseSalary)}</div>
                </div>
                <div className="bg-white p-3 rounded-lg border">
                  <div className="text-sm text-gray-600">Всего премий</div>
                  <div className="text-lg font-bold text-green-600">+{formatCurrency(calculatedTotals.totalBonuses)}</div>
                </div>
                <div className="bg-white p-3 rounded-lg border">
                  <div className="text-sm text-gray-600">Всего удержаний</div>
                  <div className="text-lg font-bold text-red-600">-{formatCurrency(calculatedTotals.totalDeductions)}</div>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg border border-blue-300">
                  <div className="text-sm text-blue-700 font-medium">К выплате</div>
                  <div className="text-xl font-bold text-blue-800">{formatCurrency(calculatedTotals.totalNet)}</div>
                </div>
              </div>
            </div>

            {/* Комментарий */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Комментарий
              </label>
              <textarea
                value={formData.comment || ''}
                onChange={(e) => handleInputChange('comment', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Дополнительные комментарии к зарплате..."
              />
            </div>
          </div>

          {/* Футер */}
          <div className="border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.teacherId || formData.baseSalary < 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Сохранение...
                </>
              ) : (
                <>
                  <FaDollarSign className="mr-2" />
                  {editingSalary ? 'Обновить' : 'Создать'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SalaryForm;
