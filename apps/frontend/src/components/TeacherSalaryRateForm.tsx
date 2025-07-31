import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaSave, FaTimes, FaInfoCircle } from 'react-icons/fa';
import { formatCurrency } from '../utils/formatters';

interface SalaryFactor {
  name: string;
  amount: number;
}

interface TeacherSalaryRateFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rateData: any) => Promise<void>;
  teacherId: number;
  teacherName: string;
  currentRate?: any;
  isLoading?: boolean;
}

const TeacherSalaryRateForm: React.FC<TeacherSalaryRateFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  teacherId,
  teacherName,
  currentRate,
  isLoading = false
}) => {
  const [baseRate, setBaseRate] = useState<number>(0);
  const [factors, setFactors] = useState<SalaryFactor[]>([]);
  const [totalRate, setTotalRate] = useState<number>(0);

  // Предопределенные факторы для быстрого выбора
  const predefinedFactors = [
    { name: 'За опыт', amount: 2000 },
    { name: 'За опыт в академии', amount: 3000 },
    { name: 'За категорию', amount: 1000 },
    { name: 'За звание', amount: 1500 },
    { name: 'За руководство', amount: 2500 },
    { name: 'За методическую работу', amount: 1200 },
  ];

  // Загрузка текущих данных при открытии формы
  useEffect(() => {
    if (isOpen && currentRate) {
      setBaseRate(currentRate.baseRate || 0);
      setFactors(currentRate.factors || []);
    } else if (isOpen) {
      // Сброс формы для нового преподавателя
      setBaseRate(0);
      setFactors([]);
    }
  }, [isOpen, currentRate]);

  // Пересчет общей ставки при изменении базовой ставки или факторов
  useEffect(() => {
    const factorsSum = factors.reduce((sum, factor) => sum + factor.amount, 0);
    setTotalRate(baseRate + factorsSum);
  }, [baseRate, factors]);

  const addFactor = (predefined?: SalaryFactor) => {
    const newFactor = predefined || { name: '', amount: 0 };
    setFactors([...factors, newFactor]);
  };

  const updateFactor = (index: number, field: keyof SalaryFactor, value: string | number) => {
    const updatedFactors = factors.map((factor, i) => 
      i === index ? { ...factor, [field]: value } : factor
    );
    setFactors(updatedFactors);
  };

  const removeFactor = (index: number) => {
    setFactors(factors.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (baseRate <= 0) {
      alert('Базовая ставка должна быть больше 0');
      return;
    }

    const rateData = {
      teacherId,
      baseRate,
      factors: factors.filter(f => f.name && f.amount > 0)
      // Убираем totalRate - бэкенд будет его вычислять автоматически
    };

    try {
      await onSubmit(rateData);
      onClose();
    } catch (error) {
      console.error('Ошибка при сохранении ставки:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Заголовок */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 rounded-t-xl text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Настройка ставки преподавателя</h2>
              <p className="text-blue-100">{teacherName}</p>
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
          {/* Информационная панель */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <FaInfoCircle className="text-blue-600 mt-1" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-2">Как формируется итоговая ставка:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Базовая ставка - основная почасовая оплата</li>
                  <li>Факторы - дополнительные надбавки (опыт, категория, звание и т.д.)</li>
                  <li>Итоговая ставка = Базовая ставка + Сумма всех факторов</li>
                  <li>Зарплата рассчитывается как: Отработанные часы × Итоговая ставка</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Базовая ставка */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Базовая ставка (тенге за час) *
            </label>
            <input
              type="number"
              value={baseRate}
              onChange={(e) => setBaseRate(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Например: 1500"
              min="0"
              step="100"
              required
            />
          </div>

          {/* Факторы */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Дополнительные факторы
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => addFactor()}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                >
                  <FaPlus className="inline mr-1" />
                  Добавить фактор
                </button>
              </div>
            </div>

            {/* Быстрые кнопки для предопределенных факторов */}
            <div className="mb-4">
              <p className="text-xs text-gray-600 mb-2">Быстрое добавление:</p>
              <div className="flex flex-wrap gap-2">
                {predefinedFactors.map((factor, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => addFactor(factor)}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-xs hover:bg-gray-200"
                  >
                    {factor.name} (+{formatCurrency(factor.amount)})
                  </button>
                ))}
              </div>
            </div>

            {/* Список факторов */}
            <div className="space-y-3">
              {factors.map((factor, index) => (
                <div key={index} className="flex gap-3 items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={factor.name}
                      onChange={(e) => updateFactor(index, 'name', e.target.value)}
                      placeholder="Название фактора"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="w-32">
                    <input
                      type="number"
                      value={factor.amount}
                      onChange={(e) => updateFactor(index, 'amount', Number(e.target.value))}
                      placeholder="Сумма"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      min="0"
                      step="100"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFactor(index)}
                    className="text-red-600 hover:text-red-800 p-2"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Расчет итоговой ставки */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-green-800 mb-3">Расчет итоговой ставки</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Базовая ставка:</span>
                <span className="font-medium">{formatCurrency(baseRate)}</span>
              </div>
              {factors.map((factor, index) => (
                <div key={index} className="flex justify-between text-gray-600">
                  <span>+ {factor.name || 'Без названия'}:</span>
                  <span>+{formatCurrency(factor.amount)}</span>
                </div>
              ))}
              <hr className="border-green-300" />
              <div className="flex justify-between text-lg font-bold text-green-800">
                <span>Итоговая ставка:</span>
                <span>{formatCurrency(totalRate)}</span>
              </div>
            </div>
          </div>

          {/* Пример расчета зарплаты */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">Пример расчета зарплаты</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-800">120ч</div>
                <div className="text-blue-600">Отработано часов</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-800">×</div>
                <div className="text-blue-600">умножить на</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-800">{formatCurrency(totalRate)}</div>
                <div className="text-blue-600">Итоговая ставка</div>
              </div>
            </div>
            <div className="text-center mt-4 pt-4 border-t border-blue-300">
              <div className="text-2xl font-bold text-blue-800">
                = {formatCurrency(120 * totalRate)}
              </div>
              <div className="text-blue-600">Итоговая зарплата</div>
            </div>
          </div>

          {/* Кнопки */}
          <div className="flex justify-end gap-3">
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
              disabled={isLoading || baseRate <= 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Сохранение...
                </>
              ) : (
                <>
                  <FaSave />
                  Сохранить ставку
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeacherSalaryRateForm;
