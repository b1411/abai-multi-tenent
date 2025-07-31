import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { salaryService } from '../services/salaryService';

interface SalaryCalculationBreakdownProps {
  isOpen: boolean;
  onClose: () => void;
  salaryId: number;
}

const SalaryCalculationBreakdown: React.FC<SalaryCalculationBreakdownProps> = ({
  isOpen,
  onClose,
  salaryId
}) => {
  const [salary, setSalary] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && salaryId) {
      setLoading(true);
      salaryService.getSalary(salaryId)
        .then(setSalary)
        .catch(() => setSalary(null))
        .finally(() => setLoading(false));
    }
  }, [isOpen, salaryId]);

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!salary) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <p>Данные не найдены</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-600 text-white rounded">
            Закрыть
          </button>
        </div>
      </div>
    );
  }

  const teacher = salary.teacher || {};
  const user = teacher.user || {};
  const name = `${user.surname || ''} ${user.name || ''}`.trim() || 'Преподаватель';
  
  const hourlyRate = salary.hourlyRate || 0;
  const hoursWorked = salary.hoursWorked || 0;
  const baseSalary = salary.baseSalary || 0;
  const totalGross = salary.totalGross || 0;
  const totalNet = salary.totalNet || 0;
  
  // Подсчет бонусов и удержаний из массивов
  const bonusesArray = salary.bonuses || [];
  const deductionsArray = salary.deductions || [];
  
  const totalBonuses = bonusesArray.reduce((sum: number, bonus: any) => {
    return sum + (bonus.isPercentage ? (baseSalary * bonus.amount / 100) : bonus.amount);
  }, 0);
  
  const totalDeductions = deductionsArray.reduce((sum: number, deduction: any) => {
    return sum + (deduction.isPercentage ? (baseSalary * deduction.amount / 100) : deduction.amount);
  }, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center p-4 border-b bg-blue-600 text-white">
          <h2 className="text-xl font-bold">Расчет зарплаты - {name}</h2>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-green-50 p-4 rounded border">
              <div className="text-sm text-gray-600">Базовая зарплата</div>
              <div className="text-2xl font-bold text-green-700">{baseSalary.toLocaleString()} ₸</div>
              <div className="text-xs text-gray-500">{hoursWorked} ч × {hourlyRate.toLocaleString()} ₸/ч</div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded border">
              <div className="text-sm text-gray-600">Бонусы</div>
              <div className="text-2xl font-bold text-yellow-700">{totalBonuses.toLocaleString()} ₸</div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded border">
              <div className="text-sm text-gray-600">Брутто к выплате</div>
              <div className="text-2xl font-bold text-blue-700">{totalGross.toLocaleString()} ₸</div>
            </div>
            
            <div className="bg-red-50 p-4 rounded border">
              <div className="text-sm text-gray-600">Удержания</div>
              <div className="text-2xl font-bold text-red-700">{totalDeductions.toLocaleString()} ₸</div>
            </div>
          </div>

          <div className="bg-purple-50 p-6 rounded border text-center">
            <div className="text-lg text-purple-800 mb-2">Итого к выплате (нетто)</div>
            <div className="text-4xl font-bold text-purple-900">{totalNet.toLocaleString()} ₸</div>
          </div>

          <div className="bg-gray-50 p-4 rounded border">
            <div className="font-semibold mb-2">Формула расчета:</div>
            <div className="text-center font-mono text-sm">
              {baseSalary.toLocaleString()} ₸ + {totalBonuses.toLocaleString()} ₸ - {totalDeductions.toLocaleString()} ₸ = <span className="font-bold text-purple-600">{totalNet.toLocaleString()} ₸</span>
            </div>
          </div>

          {/* Детализация бонусов */}
          {bonusesArray.length > 0 && (
            <div>
              <div className="font-semibold mb-2">Бонусы:</div>
              <div className="space-y-2">
                {bonusesArray.map((bonus: any, index: number) => (
                  <div key={index} className="flex justify-between p-2 bg-yellow-50 rounded">
                    <span>{bonus.name}</span>
                    <span className="font-semibold">
                      {bonus.isPercentage 
                        ? `${bonus.amount}% (${(baseSalary * bonus.amount / 100).toLocaleString()} ₸)`
                        : `${bonus.amount.toLocaleString()} ₸`
                      }
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Детализация удержаний */}
          {deductionsArray.length > 0 && (
            <div>
              <div className="font-semibold mb-2">Удержания:</div>
              <div className="space-y-2">
                {deductionsArray.map((deduction: any, index: number) => (
                  <div key={index} className="flex justify-between p-2 bg-red-50 rounded">
                    <span>{deduction.name}</span>
                    <span className="font-semibold">
                      {deduction.isPercentage 
                        ? `${deduction.amount}% (${(baseSalary * deduction.amount / 100).toLocaleString()} ₸)`
                        : `${deduction.amount.toLocaleString()} ₸`
                      }
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="font-semibold mb-2">Детали расчета:</div>
              <div className="space-y-2">
                <div className="flex justify-between p-2 bg-gray-50 rounded">
                  <span>Отработано часов:</span>
                  <span className="font-semibold">{hoursWorked} ч</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-50 rounded">
                  <span>Часовая ставка:</span>
                  <span className="font-semibold">{hourlyRate.toLocaleString()} ₸/ч</span>
                </div>
                <div className="flex justify-between p-2 bg-blue-50 rounded">
                  <span>Базовая зарплата:</span>
                  <span className="font-bold">{baseSalary.toLocaleString()} ₸</span>
                </div>
              </div>
            </div>
            
            <div>
              <div className="font-semibold mb-2">Информация:</div>
              <div className="space-y-2">
                <div className="flex justify-between p-2 bg-gray-50 rounded">
                  <span>Месяц:</span>
                  <span className="font-semibold">{salary.month}/{salary.year}</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-50 rounded">
                  <span>Статус:</span>
                  <span className="font-semibold">
                    {salary.status === 'APPROVED' ? 'Утверждено' : 
                     salary.status === 'PENDING' ? 'Ожидает' : 
                     salary.status === 'PAID' ? 'Выплачено' : salary.status}
                  </span>
                </div>
                {salary.approvedAt && (
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span>Утверждено:</span>
                    <span className="font-semibold">
                      {new Date(salary.approvedAt).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalaryCalculationBreakdown;
