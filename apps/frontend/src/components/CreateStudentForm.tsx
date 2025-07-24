import React, { useState, useEffect } from 'react';
import { studentService, CreateFullStudentData } from '../services/studentService';
import { useAuth } from '../hooks/useAuth';

interface Group {
  id: number;
  name: string;
  courseNumber: number;
}

interface CreateStudentFormProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

export const CreateStudentForm: React.FC<CreateStudentFormProps> = ({
  onSuccess,
  onClose,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [formData, setFormData] = useState<CreateFullStudentData>({
    email: '',
    name: '',
    surname: '',
    password: '',
    phone: '',
    middlename: '',
    groupId: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      // Предполагаем, что у нас есть сервис для получения групп
      // const groupsData = await groupService.getAllGroups();
      // setGroups(groupsData);
      
      // Временно добавим тестовые данные
      setGroups([
        { id: 1, name: 'Группа А', courseNumber: 1 },
        { id: 2, name: 'Группа Б', courseNumber: 1 },
        { id: 3, name: 'Группа В', courseNumber: 2 },
      ]);
    } catch (error) {
      console.error('Ошибка загрузки групп:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email обязателен';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Некорректный email';
    }

    if (!formData.name) {
      newErrors.name = 'Имя обязательно';
    }

    if (!formData.surname) {
      newErrors.surname = 'Фамилия обязательна';
    }

    if (!formData.password) {
      newErrors.password = 'Пароль обязателен';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Пароль должен содержать минимум 6 символов';
    }

    if (!formData.groupId) {
      newErrors.groupId = 'Выберите группу';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const result = await studentService.createFullStudent(formData);
      console.log('Студент создан:', result);
      
      // Уведомление об успехе
      alert('Студент успешно создан!');
      
      if (onSuccess) {
        onSuccess();
      }
      
      // Очистка формы
      setFormData({
        email: '',
        name: '',
        surname: '',
        password: '',
        phone: '',
        middlename: '',
        groupId: 0,
      });
    } catch (error: any) {
      console.error('Ошибка создания студента:', error);
      alert(error.response?.data?.message || 'Ошибка при создании студента');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'groupId' ? parseInt(value) : value,
    }));

    // Очистка ошибки при изменении поля
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  // Проверяем права доступа
  if (!user || !['ADMIN', 'TEACHER'].includes(user.role)) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700">У вас нет прав для создания студентов</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Создать нового студента</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className={`mt-1 block w-full rounded-md border ${
              errors.email ? 'border-red-300' : 'border-gray-300'
            } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
            placeholder="student@example.com"
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="surname" className="block text-sm font-medium text-gray-700">
              Фамилия *
            </label>
            <input
              type="text"
              id="surname"
              name="surname"
              value={formData.surname}
              onChange={handleInputChange}
              className={`mt-1 block w-full rounded-md border ${
                errors.surname ? 'border-red-300' : 'border-gray-300'
              } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
              placeholder="Петров"
            />
            {errors.surname && <p className="mt-1 text-sm text-red-600">{errors.surname}</p>}
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Имя *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`mt-1 block w-full rounded-md border ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
              placeholder="Иван"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="middlename" className="block text-sm font-medium text-gray-700">
            Отчество
          </label>
          <input
            type="text"
            id="middlename"
            name="middlename"
            value={formData.middlename}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Сергеевич"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Телефон
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="+7 700 123 45 67"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Пароль *
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            className={`mt-1 block w-full rounded-md border ${
              errors.password ? 'border-red-300' : 'border-gray-300'
            } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
            placeholder="Минимум 6 символов"
          />
          {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
        </div>

        <div>
          <label htmlFor="groupId" className="block text-sm font-medium text-gray-700">
            Группа *
          </label>
          <select
            id="groupId"
            name="groupId"
            value={formData.groupId}
            onChange={handleInputChange}
            className={`mt-1 block w-full rounded-md border ${
              errors.groupId ? 'border-red-300' : 'border-gray-300'
            } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
          >
            <option value={0}>Выберите группу</option>
            {groups.map(group => (
              <option key={group.id} value={group.id}>
                {group.name} (Курс {group.courseNumber})
              </option>
            ))}
          </select>
          {errors.groupId && <p className="mt-1 text-sm text-red-600">{errors.groupId}</p>}
        </div>

        <div className="flex justify-end space-x-4 pt-4">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Отмена
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Создание...' : 'Создать студента'}
          </button>
        </div>
      </form>
    </div>
  );
};
