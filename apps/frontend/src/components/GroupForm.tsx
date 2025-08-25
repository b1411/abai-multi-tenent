import React, { useState, useEffect } from 'react';
import { CreateGroupDto } from '../types/group';
import { teacherService } from '../services/teacherService';
import type { Teacher } from '../types/teacher';

interface GroupFormProps {
  onSubmit: (data: CreateGroupDto) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const GroupForm: React.FC<GroupFormProps> = ({
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [formData, setFormData] = useState<CreateGroupDto>({
    name: '',
    courseNumber: 1,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [teachersError, setTeachersError] = useState<string | null>(null);

  useEffect(() => {
    const loadTeachers = async () => {
      setLoadingTeachers(true);
      try {
        const list = await teacherService.getTeachers();
        setTeachers(list);
        setTeachersError(null);
      } catch (e) {
        setTeachersError('Не удалось загрузить преподавателей');
        setTeachers([]);
      }
      setLoadingTeachers(false);
    };
    loadTeachers();
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Название группы обязательно';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Название группы должно содержать минимум 2 символа';
    }

    if (formData.courseNumber < 1) {
      newErrors.courseNumber = 'Класс должен быть не меньше 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
      setFormData({ name: '', courseNumber: 1 });
      setErrors({});
    } catch {
      /* handled outside */
    }
  };

  const handleInputChange = (field: keyof CreateGroupDto, value: string | number | null) => {
    setFormData(prev => {
      const next = { ...prev };
      if (field === 'curatorTeacherId') {
        if (value === null || value === '' || Number.isNaN(value)) {
          delete (next as any).curatorTeacherId;
        } else {
          (next as any).curatorTeacherId = value as number;
        }
      } else {
        (next as any)[field] = value;
      }
      return next;
    });
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Создать новую группу
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Название группы *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Например: Группа А, 1-А, Математика-2024"
            disabled={loading}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        <div>
          <label htmlFor="courseNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Класс *
          </label>
          <input
            type="number"
            id="courseNumber"
            value={formData.courseNumber}
            onChange={(e) => handleInputChange('courseNumber', parseInt(e.target.value))}
            min="1"
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.courseNumber ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Введите номер класса"
            disabled={loading}
          />
          {errors.courseNumber && (
            <p className="mt-1 text-sm text-red-600">{errors.courseNumber}</p>
          )}
        </div>

        <div>
          <label htmlFor="curatorTeacherId" className="block text-sm font-medium text-gray-700 mb-1">
            Куратор (опционально)
          </label>
          <select
            id="curatorTeacherId"
            value={formData.curatorTeacherId ?? ''}
            onChange={(e) => handleInputChange(
              'curatorTeacherId',
              e.target.value ? parseInt(e.target.value) : null
            )}
            disabled={loading || loadingTeachers}
            className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300 bg-white"
          >
            <option value="">— Не выбран —</option>
            {teachers.map(t => (
              <option key={t.id} value={t.id}>
                {t.user.surname} {t.user.name}{t.user.middlename ? ` ${t.user.middlename}` : ''}
              </option>
            ))}
          </select>
          {loadingTeachers && (
            <p className="mt-1 text-xs text-gray-500">Загрузка преподавателей...</p>
          )}
          {teachersError && (
            <p className="mt-1 text-xs text-red-600">{teachersError}</p>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={loading}
          >
            Отменить
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Создание...' : 'Создать группу'}
          </button>
        </div>
      </form>
    </div>
  );
};
