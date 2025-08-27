import React, { useState, useEffect } from 'react';
import { FaTimes, FaUsers, FaCalendarAlt, FaMoneyBillWave, FaEdit, FaTrash } from 'react-icons/fa';
import { Alert } from './ui';
import { groupService } from '../services/groupService';
import { studentService, Student } from '../services/studentService';
import { PaymentRecurrence } from '../services/groupPaymentService';

interface Group {
  id: number;
  name: string;
  studentsCount?: number;
}

interface StudentOverride {
  studentId: number;
  amount?: number;
  description?: string;
  excluded?: boolean;
}

interface CreateGroupPaymentDto {
  groupId: number;
  type: string;
  amount: number;
  dueDate: string;
  description?: string;
  serviceName?: string;
  excludedStudentIds?: number[];
  studentOverrides?: StudentOverride[];
  recurrence?: PaymentRecurrence;
  recurrenceCount?: number;
  recurrenceEndDate?: string;
  sendNotifications?: boolean;
}

interface GroupPaymentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payment: CreateGroupPaymentDto) => void;
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

const RECURRENCE_OPTIONS = [
  { value: PaymentRecurrence.ONCE, label: 'Однократно' },
  { value: PaymentRecurrence.WEEKLY, label: 'Еженедельно' },
  { value: PaymentRecurrence.MONTHLY, label: 'Ежемесячно' },
  { value: PaymentRecurrence.QUARTERLY, label: 'По акад. четверти' },
  { value: PaymentRecurrence.YEARLY, label: 'Ежегодно' }
];

const GroupPaymentForm: React.FC<GroupPaymentFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false
}) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showStudentOverrides, setShowStudentOverrides] = useState(false);
  
  const [formData, setFormData] = useState<CreateGroupPaymentDto>({
    groupId: 0,
    type: 'TUITION',
    amount: 0,
    dueDate: '',
    serviceName: '',
    excludedStudentIds: [],
    studentOverrides: []
  });

  // Загрузка списка групп
  useEffect(() => {
    if (isOpen) {
      loadGroups();
    }
  }, [isOpen]);

  // Загрузка студентов группы
  useEffect(() => {
    if (formData.groupId) {
      loadGroupStudents(formData.groupId);
    } else {
      setStudents([]);
    }
  }, [formData.groupId]);

  const loadGroups = async () => {
    try {
      setLoadingGroups(true);
      const groups = await groupService.getAllGroups();
      setGroups(groups || []);
    } catch (err) {
      console.error('Ошибка загрузки групп:', err);
      setError('Не удалось загрузить список групп');
    } finally {
      setLoadingGroups(false);
    }
  };

  const loadGroupStudents = async (groupId: number) => {
    try {
      setLoadingStudents(true);
      const allStudents = await studentService.getAllStudents();
      const groupStudents = allStudents.filter(student => student.group.id === groupId);
      setStudents(groupStudents || []);
    } catch (err) {
      console.error('Ошибка загрузки студентов:', err);
      setError('Не удалось загрузить список студентов группы');
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleInputChange = (field: keyof CreateGroupPaymentDto, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStudentExclusionToggle = (studentId: number) => {
    const excludedIds = formData.excludedStudentIds || [];
    const isExcluded = excludedIds.includes(studentId);
    
    if (isExcluded) {
      handleInputChange('excludedStudentIds', excludedIds.filter(id => id !== studentId));
    } else {
      handleInputChange('excludedStudentIds', [...excludedIds, studentId]);
    }
  };

  const handleStudentOverride = (studentId: number, field: keyof StudentOverride, value: any) => {
    const overrides = formData.studentOverrides || [];
    const existingOverrideIndex = overrides.findIndex(o => o.studentId === studentId);
    
    if (existingOverrideIndex >= 0) {
      const updatedOverrides = [...overrides];
      updatedOverrides[existingOverrideIndex] = {
        ...updatedOverrides[existingOverrideIndex],
        [field]: value
      };
      handleInputChange('studentOverrides', updatedOverrides);
    } else {
      const newOverride: StudentOverride = {
        studentId,
        [field]: value
      };
      handleInputChange('studentOverrides', [...overrides, newOverride]);
    }
  };

  const removeStudentOverride = (studentId: number) => {
    const overrides = formData.studentOverrides || [];
    handleInputChange('studentOverrides', overrides.filter(o => o.studentId !== studentId));
  };

  const getStudentOverride = (studentId: number): StudentOverride | undefined => {
    return formData.studentOverrides?.find(o => o.studentId === studentId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Валидация
    if (!formData.groupId) {
      setError('Выберите группу');
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
      groupId: 0,
      type: 'TUITION',
      amount: 0,
      dueDate: '',
      serviceName: '',
      excludedStudentIds: [],
      studentOverrides: []
    });
    setError(null);
    setShowStudentOverrides(false);
    onClose();
  };

  if (!isOpen) return null;

  const selectedGroup = groups.find(g => g.id === formData.groupId);
  const excludedIds = formData.excludedStudentIds || [];
  const activeStudentsCount = students.length - excludedIds.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <FaUsers className="mr-2 text-blue-600" />
            Создать групповой платеж
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Выбор группы */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaUsers className="inline mr-1" />
                Группа *
              </label>
              {loadingGroups ? (
                <div className="text-sm text-gray-500">Загрузка групп...</div>
              ) : (
                <select
                  value={formData.groupId}
                  onChange={(e) => handleInputChange('groupId', parseInt(e.target.value) || 0)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value={0}>Выберите группу</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name} ({group.studentsCount} студентов)
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
                <FaMoneyBillWave className="inline mr-1" />
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
            <div className="md:col-span-2">
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
          </div>

          {/* Настройки периодичности */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Настройки периодичности</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Периодичность */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Периодичность
                </label>
                <select
                  value={formData.recurrence || PaymentRecurrence.ONCE}
                  onChange={(e) => handleInputChange('recurrence', e.target.value as PaymentRecurrence)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {RECURRENCE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Количество повторений */}
              {formData.recurrence !== PaymentRecurrence.ONCE && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Количество платежей
                  </label>
                  <input
                    type="number"
                    value={formData.recurrenceCount || 1}
                    onChange={(e) => handleInputChange('recurrenceCount', parseInt(e.target.value) || 1)}
                    min="1"
                    max="12"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              {/* Дата окончания */}
              {formData.recurrence !== PaymentRecurrence.ONCE && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Дата окончания (опционально)
                  </label>
                  <input
                    type="date"
                    value={formData.recurrenceEndDate || ''}
                    onChange={(e) => handleInputChange('recurrenceEndDate', e.target.value)}
                    min={formData.dueDate}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>

            {/* Предупреждение о периодических платежах */}
            {formData.recurrence !== PaymentRecurrence.ONCE && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  <strong>Внимание:</strong> При настройке периодичности будет создано несколько платежей для каждого студента согласно выбранному расписанию.
                  {formData.recurrenceCount && formData.recurrenceCount > 1 && (
                    <> Всего будет создано {formData.recurrenceCount} платежей для каждого студента.</>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Настройки уведомлений */}
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Уведомления</h3>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="sendNotifications"
                  checked={formData.sendNotifications !== false}
                  onChange={(e) => handleInputChange('sendNotifications', e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="sendNotifications" className="text-sm font-medium text-gray-700">
                  Отправить уведомления родителям
                </label>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              При включении этой опции родители студентов получат уведомления о новых платежах через систему уведомлений.
            </p>
          </div>

          {/* Информация о группе и студентах */}
          {selectedGroup && students.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Студенты группы {selectedGroup.name}
                </h3>
                <div className="text-sm text-gray-600">
                  Будет создано платежей: <span className="font-semibold text-blue-600">{activeStudentsCount}</span> из {students.length}
                </div>
              </div>

              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setShowStudentOverrides(!showStudentOverrides)}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                >
                  {showStudentOverrides ? 'Скрыть настройки' : 'Настроить студентов'}
                </button>
              </div>

              {showStudentOverrides && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {students.map((student) => {
                    const isExcluded = excludedIds.includes(student.id);
                    const override = getStudentOverride(student.id);
                    
                    return (
                      <div key={student.id} className={`flex items-center justify-between p-3 rounded-md border ${isExcluded ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={!isExcluded}
                            onChange={() => handleStudentExclusionToggle(student.id)}
                            className="mr-3"
                          />
                          <span className={`font-medium ${isExcluded ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                            {student.user.name} {student.user.surname}
                          </span>
                        </div>
                        
                        {!isExcluded && (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              placeholder={`${formData.amount} KZT`}
                              value={override?.amount || ''}
                              onChange={(e) => handleStudentOverride(student.id, 'amount', parseFloat(e.target.value) || undefined)}
                              className="w-24 px-2 py-1 text-sm border border-gray-300 rounded-md"
                              step="0.01"
                            />
                            <input
                              type="text"
                              placeholder="Описание"
                              value={override?.description || ''}
                              onChange={(e) => handleStudentOverride(student.id, 'description', e.target.value)}
                              className="w-32 px-2 py-1 text-sm border border-gray-300 rounded-md"
                            />
                            {override && (
                              <button
                                type="button"
                                onClick={() => removeStudentOverride(student.id)}
                                className="text-red-600 hover:text-red-800"
                                title="Сбросить настройки"
                              >
                                <FaTrash className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

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
              disabled={isLoading || activeStudentsCount === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Создание...
                </>
              ) : (
                `Создать ${activeStudentsCount} платежей`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GroupPaymentForm;
