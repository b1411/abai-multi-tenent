import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaSave, FaTimes, FaEdit, FaInfoCircle } from 'react-icons/fa';
import { formatCurrency } from '../utils/formatters';

interface Adjustment {
  name: string;
  amount: number;
  comment?: string;
}

interface SalaryAdjustmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (adjustments: { bonuses: Adjustment[]; deductions: Adjustment[]; comment?: string }) => Promise<void>;
  salary: any;
  isLoading?: boolean;
}

const SalaryAdjustmentsModal: React.FC<SalaryAdjustmentsModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  salary,
  isLoading = false
}) => {
  const [bonuses, setBonuses] = useState<Adjustment[]>([]);
  const [deductions, setDeductions] = useState<Adjustment[]>([]);
  const [comment, setComment] = useState<string>('');
  const [newTotalGross, setNewTotalGross] = useState<number>(0);
  const [newTotalNet, setNewTotalNet] = useState<number>(0);

  // Предопределенные типы бонусов и удержаний
  const predefinedBonuses = [
    { name: 'Премия за качество', amount: 25000 },
    { name: 'Надбавка за интенсивность', amount: 15000 },
    { name: 'Премия по итогам месяца', amount: 20000 },
    { name: 'Доплата за замещение', amount: 10000 },
    { name: 'Премия за проведение мероприятий', amount: 12000 },
  ];

  const predefinedDeductions = [
    { name: 'Аванс', amount: 100000 },
    { name: 'Подоходный налог', amount: 0 },
    { name: 'Соцвзносы', amount: 0 },
    { name: 'Удержание за прогул', amount: 5000 },
    { name: 'Возмещение ущерба', amount: 0 },
  ];

  // Инициализация данных при открытии модального окна
  useEffect(() => {
    if (isOpen && salary) {
      setBonuses(salary.bonuses || []);
      setDeductions(salary.deductions || []);
      setComment(salary.comment || '');
    }
  }, [isOpen, salary]);

  // Пересчет сумм при изменении бонусов или удержаний
  useEffect(() => {
    if (salary) {
      const totalBonuses = bonuses.reduce((sum, bonus) => sum + bonus.amount, 0);
      const totalDeductions = deductions.reduce((sum, deduction) => sum + deduction.amount, 0);
      
      setNewTotalGross(salary.baseSalary + totalBonuses);
      setNewTotalNet(salary.baseSalary + totalBonuses - totalDeductions);
    }
  }, [bonuses, deductions, salary]);

  const addBonus = (predefined?: Adjustment) => {
    const newBonus = predefined || { name: '', amount: 0, comment: '' };
    setBonuses([...bonuses, newBonus]);
  };

  const addDeduction = (predefined?: Adjustment) => {
    const newDeduction = predefined || { name: '', amount: 0, comment: '' };
    setDeductions([...deductions, newDeduction]);
  };

  const updateBonus = (index: number, field: keyof Adjustment, value: string | number) => {
    const updatedBonuses = bonuses.map((bonus, i) => 
      i === index ? { ...bonus, [field]: value } : bonus
    );
    setBonuses(updatedBonuses);
  };

  const updateDeduction = (index: number, field: keyof Adjustment, value: string | number) => {
    const updatedDeductions = deductions.map((deduction, i) => 
      i === index ? { ...deduction, [field]: value } : deduction
    );
    setDeductions(updatedDeductions);
  };

  const removeBonus = (index: number) => {
    setBonuses(bonuses.filter((_, i) => i !== index));
  };

  const removeDeduction = (index: number) => {
    setDeductions(deductions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const adjustments = {
      bonuses: bonuses.filter(b => b.name && b.amount !== 0),
      deductions: deductions.filter(d => d.name && d.amount !== 0),
      comment
    };

    try {
      await onSubmit(adjustments);
      onClose();
    } catch (error) {
      console.error('Ошибка при сохранении корректировок:', error);
    }
  };

  if (!isOpen || !salary) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Заголовок */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-6 rounded-t-xl text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Редактирование надбавок и удержаний</h2>
              <p className="text-purple-100">
                {salary.teacher?.user.surname} {salary.teacher?.user.name} - {salary.month}/{salary.year}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Информация о базовой зарплате */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <FaInfoCircle className="text-blue-600 mt-1" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-2">Информация о базовой зарплате:</p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <span className="font-medium">Базовая зарплата:</span>
                    <div className="text-lg">{formatCurrency(salary.baseSalary)}</div>
                  </div>
                  <div>
                    <span className="font-medium">Текущая к выплате:</span>
                    <div className="text-lg">{formatCurrency(salary.totalNet)}</div>
                  </div>
                  <div>
                    <span className="font-medium">Новая к выплате:</span>
                    <div className="text-lg font-bold text-purple-800">{formatCurrency(newTotalNet)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Бонусы */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Бонусы и надбавки</h3>
                <button
                  type="button"
                  onClick={() => addBonus()}
                  className="px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                >
                  <FaPlus className="inline mr-1" />
                  Добавить
                </button>
              </div>

              {/* Быстрые кнопки для бонусов */}
              <div className="mb-4">
                <p className="text-xs text-gray-600 mb-2">Быстрое добавление:</p>
                <div className="space-y-1">
                  {predefinedBonuses.map((bonus, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => addBonus(bonus)}
                      className="block w-full text-left px-3 py-1 bg-green-50 text-green-700 rounded-md text-xs hover:bg-green-100"
                    >
                      {bonus.name} (+{formatCurrency(bonus.amount)})
                    </button>
                  ))}
                </div>
              </div>

              {/* Список бонусов */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {bonuses.map((bonus, index) => (
                  <div key={index} className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={bonus.name}
                          onChange={(e) => updateBonus(index, 'name', e.target.value)}
                          placeholder="Название бонуса"
                          className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => removeBonus(index)}
                          className="text-red-600 hover:text-red-800 p-2"
                        >
                          <FaTrash />
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={bonus.amount}
                          onChange={(e) => updateBonus(index, 'amount', Number(e.target.value))}
                          placeholder="Сумма"
                          className="w-32 border border-gray-300 rounded-md px-3 py-2 text-sm"
                          min="0"
                          step="1000"
                        />
                        <input
                          type="text"
                          value={bonus.comment || ''}
                          onChange={(e) => updateBonus(index, 'comment', e.target.value)}
                          placeholder="Комментарий"
                          className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Итого бонусов */}
              <div className="mt-4 p-3 bg-green-100 rounded-lg">
                <div className="flex justify-between font-semibold text-green-800">
                  <span>Итого бонусов:</span>
                  <span>+{formatCurrency(bonuses.reduce((sum, b) => sum + b.amount, 0))}</span>
                </div>
              </div>
            </div>

            {/* Удержания */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Удержания</h3>
                <button
                  type="button"
                  onClick={() => addDeduction()}
                  className="px-3 py-1 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
                >
                  <FaPlus className="inline mr-1" />
                  Добавить
                </button>
              </div>

              {/* Быстрые кнопки для удержаний */}
              <div className="mb-4">
                <p className="text-xs text-gray-600 mb-2">Быстрое добавление:</p>
                <div className="space-y-1">
                  {predefinedDeductions.map((deduction, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => addDeduction(deduction)}
                      className="block w-full text-left px-3 py-1 bg-red-50 text-red-700 rounded-md text-xs hover:bg-red-100"
                    >
                      {deduction.name} {deduction.amount > 0 && `(-${formatCurrency(deduction.amount)})`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Список удержаний */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {deductions.map((deduction, index) => (
                  <div key={index} className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={deduction.name}
                          onChange={(e) => updateDeduction(index, 'name', e.target.value)}
                          placeholder="Название удержания"
                          className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => removeDeduction(index)}
                          className="text-red-600 hover:text-red-800 p-2"
                        >
                          <FaTrash />
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={deduction.amount}
                          onChange={(e) => updateDeduction(index, 'amount', Number(e.target.value))}
                          placeholder="Сумма"
                          className="w-32 border border-gray-300 rounded-md px-3 py-2 text-sm"
                          min="0"
                          step="1000"
                        />
                        <input
                          type="text"
                          value={deduction.comment || ''}
                          onChange={(e) => updateDeduction(index, 'comment', e.target.value)}
                          placeholder="Комментарий"
                          className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Итого удержаний */}
              <div className="mt-4 p-3 bg-red-100 rounded-lg">
                <div className="flex justify-between font-semibold text-red-800">
                  <span>Итого удержаний:</span>
                  <span>-{formatCurrency(deductions.reduce((sum, d) => sum + d.amount, 0))}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Комментарий */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Комментарий к корректировке
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Добавьте комментарий к изменениям..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={3}
            />
          </div>

          {/* Итоговый расчет */}
          <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-purple-800 mb-3">Итоговый расчет</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Базовая зарплата:</span>
                <span className="font-medium">{formatCurrency(salary.baseSalary)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>+ Бонусы:</span>
                <span>+{formatCurrency(bonuses.reduce((sum, b) => sum + b.amount, 0))}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>= Общая сумма:</span>
                <span className="font-medium">{formatCurrency(newTotalGross)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>- Удержания:</span>
                <span>-{formatCurrency(deductions.reduce((sum, d) => sum + d.amount, 0))}</span>
              </div>
              <hr className="border-purple-300" />
              <div className="flex justify-between text-lg font-bold text-purple-800">
                <span>К выплате:</span>
                <span>{formatCurrency(newTotalNet)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Изменение:</span>
                <span className={newTotalNet > salary.totalNet ? 'text-green-600' : newTotalNet < salary.totalNet ? 'text-red-600' : 'text-gray-600'}>
                  {newTotalNet > salary.totalNet ? '+' : ''}{formatCurrency(newTotalNet - salary.totalNet)}
                </span>
              </div>
            </div>
          </div>

          {/* Кнопки */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              disabled={isLoading}
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Сохранение...
                </>
              ) : (
                <>
                  <FaSave />
                  Сохранить изменения
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SalaryAdjustmentsModal;
