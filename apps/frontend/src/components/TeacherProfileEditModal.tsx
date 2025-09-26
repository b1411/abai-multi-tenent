import React, { useState, useEffect } from 'react';
import { FaTimes, FaUser, FaEnvelope, FaPhone, FaSave } from 'react-icons/fa';
import { userService } from '../services/userService';

interface TeacherProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: any;
  onSave: (updatedTeacher: any) => void;
}

const TeacherProfileEditModal: React.FC<TeacherProfileEditModalProps> = ({
  isOpen,
  onClose,
  teacher,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    middlename: '',
    email: '',
    phone: '',
    specialization: '',
    qualification: '',
    experience: '',
    department: '',
    position: '',
    category: '',
    hireDate: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (teacher && isOpen) {
      setFormData({
        name: teacher.user?.name || '',
        surname: teacher.user?.surname || '',
        middlename: teacher.user?.middlename || '',
        email: teacher.user?.email || '',
        phone: teacher.user?.phone || '',
        specialization: teacher.specialization || '',
        qualification: teacher.qualification || '',
        experience: teacher.experience?.toString() || '',
        department: teacher.department || '',
        position: teacher.position || '',
        category: teacher.category || '',
        hireDate: teacher.hireDate ? new Date(teacher.hireDate).toISOString().split('T')[0] : '',
      });
      setError(null);
    }
  }, [teacher, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacher) return;

    setLoading(true);
    setError(null);

    try {
      // Разделяем данные на User и Teacher
      const userData = {
        name: formData.name,
        surname: formData.surname,
        middlename: formData.middlename,
        email: formData.email,
        phone: formData.phone,
      };

      const teacherData = {
        specialization: formData.specialization,
        qualification: formData.qualification,
        experience: formData.experience ? parseInt(formData.experience) : undefined,
        department: formData.department,
        position: formData.position,
        category: formData.category,
        hireDate: formData.hireDate || null,
      };

      // Обновляем данные пользователя
      const updatedUser = await userService.updateUser(teacher.user.id, userData);

      // Обновляем данные преподавателя
      const updatedTeacherProfile = await userService.updateTeacherProfile(teacher.id, teacherData);

      // Обновляем данные преподавателя
      const updatedTeacher = {
        ...teacher,
        ...updatedTeacherProfile,
        user: {
          ...teacher.user,
          ...updatedUser
        }
      };

      onSave(updatedTeacher);
      onClose();
    } catch (error: any) {
      console.error('Ошибка при обновлении профиля:', error);
      setError(error.response?.data?.message || 'Произошла ошибка при сохранении');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <FaUser className="mr-2 text-blue-600" />
            Редактировать профиль
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FaTimes className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Имя */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Имя *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Фамилия */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Фамилия *
            </label>
            <input
              type="text"
              name="surname"
              value={formData.surname}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Отчество */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Отчество
            </label>
            <input
              type="text"
              name="middlename"
              value={formData.middlename}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <FaEnvelope className="mr-1 w-4 h-4" />
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Телефон */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <FaPhone className="mr-1 w-4 h-4" />
              Телефон
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="+7 (700) 123-45-67"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Специализация */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Специализация
            </label>
            <input
              type="text"
              name="specialization"
              value={formData.specialization}
              onChange={handleInputChange}
              placeholder="Например: Физика, Математика"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Квалификация */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Квалификация
            </label>
            <input
              type="text"
              name="qualification"
              value={formData.qualification}
              onChange={handleInputChange}
              placeholder="Например: Магистр педагогических наук"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Опыт работы */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Опыт работы (лет)
            </label>
            <input
              type="number"
              name="experience"
              value={formData.experience}
              onChange={handleInputChange}
              min="0"
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Отдел */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Отдел/Кафедра
            </label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleInputChange}
              placeholder="Например: Кафедра информатики"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Должность */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Должность
            </label>
            <input
              type="text"
              name="position"
              value={formData.position}
              onChange={handleInputChange}
              placeholder="Например: Доцент, Преподаватель"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Категория */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Педагогическая категория
            </label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              placeholder="Например: Высшая категория"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Дата приема */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Дата приема на работу
            </label>
            <input
              type="date"
              name="hireDate"
              value={formData.hireDate}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Кнопки действий */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <FaSave className="mr-2 w-4 h-4" />
                  Сохранить
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeacherProfileEditModal;
