import React, { useState, useEffect } from 'react';
import { FaTimes, FaUser, FaCalendarAlt, FaMoneyBillWave } from 'react-icons/fa';
import { Alert } from './ui';
import { CreatePaymentDto } from '../types/finance';
import { studentService, Student } from '../services/studentService';

interface PaymentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payment: CreatePaymentDto) => void;
  isLoading?: boolean;
}

const PAYMENT_TYPE_OPTIONS = [
  { value: 'TUITION', label: 'Обучение' },
  { value: 'BOOKS', label: 'Книги и учебники' },
  { value: 'DORMITORY', label: 'Общежитие' },
  { value: 'MEAL', label: 'Питание' },
  { value: 'TRANSPORT', label: 'Транспорт' },
  { value: 'EXAM', label: 'Экзамены' },
  { value: 'CERTIFICATE', label: 'Сертификаты' },
  { value: 'OTHER', label: 'Прочее' }
];

const PAYMENT_METHOD_OPTIONS = [
  { value: 'CASH', label: 'Наличные' },
  { value: 'CARD', label: 'Банковская карта' },
  { value: 'BANK_TRANSFER', label: 'Банковский перевод' },
  { value: 'ONLINE', label: 'Онлайн платеж' },
  { value: 'MOBILE', label: 'Мобильный платеж' }
];

const PaymentForm: React.FC<PaymentFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<CreatePaymentDto>({
    studentId: 0,
    type: 'TUITION',
    amount: 0,
    dueDate: '',
    serviceName: ''
  });

  // Загрузка списка студентов
  useEffect(() => {
    if (isOpen) {
      loadStudents();
    }
  }, [isOpen]);

  const loadStudents = async () => {
    try {
      setLoadingStudents(true);
      const students = await studentService.getAllStudents();
      setStudents(students || []);
    } catch (err) {
      console.error('Ошибка загрузки студентов:', err);
      setError('Не удалось загрузить список студентов');
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleInputChange = (field: keyof CreatePaymentDto, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Валидация
    if (!formData.studentId) {
      setError('Выберите студента');
      return;
    }
    
    if (!formData.amount || formData.amount <= 0) {
      setError('Сумма должна быть больше 0');
      return;
    }
    
    if (!formData.dueDate) {
      setError('Выберите дату платежа');
      return;
    }

    setError(null);
    onSubmit(formData);
  };

  const handleClose = () => {
    setFormData({
      studentId: 0,
      type: 'TUITION',
      amount: 0,
      dueDate: '',
      serviceName: ''
    });
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <FaMoneyBillWave className="mr-2 text-green-600" />
            Создать новый платеж
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <Alert variant="error">
              {error}
            </Alert>
          )}

          {/* Выбор студента */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FaUser className="inline mr-1" />
              Студент *
            </label>
            {loadingStudents ? (
              <div className="text-sm text-gray-500">Загрузка студентов...</div>
            ) : (
              <select
                value={formData.studentId}
                onChange={(e) => handleInputChange('studentId', parseInt(e.target.value) || 0)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value={0}>Выберите студента</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.user.name} {student.user.surname} ({student.group.name})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Тип платежа */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Тип платежа *
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              {PAYMENT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Сумма */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Сумма *
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', parseFloat(e.target.value))}
              step="0.01"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Дата платежа */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FaCalendarAlt className="inline mr-1" />
              Срок оплаты *
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => handleInputChange('dueDate', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Название услуги */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Название услуги
            </label>
            <input
              type="text"
              value={formData.serviceName || ''}
              onChange={(e) => handleInputChange('serviceName', e.target.value)}
              placeholder="Название услуги"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Кнопки */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Создание...
                </>
              ) : (
                'Создать платеж'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentForm;
