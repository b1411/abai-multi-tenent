import React, { useState, useEffect } from 'react';
import { FaTimes, FaExclamationTriangle, FaEye, FaEyeSlash } from 'react-icons/fa';
import { CreateRemarkData, UpdateRemarkData, StudentRemark } from '../services/studentService';

interface RemarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (remarkData: CreateRemarkData | UpdateRemarkData) => Promise<void>;
  remark?: StudentRemark | null; // Если передан - режим редактирования
  studentName: string;
}

const RemarkModal: React.FC<RemarkModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  remark,
  studentName
}) => {
  const [formData, setFormData] = useState<CreateRemarkData>({
    type: 'GENERAL',
    title: '',
    content: '',
    isPrivate: false
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditMode = !!remark;

  // Заполняем форму при редактировании
  useEffect(() => {
    if (remark) {
      setFormData({
        type: remark.type,
        title: remark.title,
        content: remark.content,
        isPrivate: remark.isPrivate
      });
    } else {
      setFormData({
        type: 'GENERAL',
        title: '',
        content: '',
        isPrivate: false
      });
    }
    setErrors({});
  }, [remark, isOpen]);

  const remarkTypes = [
    { value: 'ACADEMIC', label: 'Учебное', color: 'bg-orange-100 text-orange-800' },
    { value: 'BEHAVIOR', label: 'Поведение', color: 'bg-purple-100 text-purple-800' },
    { value: 'ATTENDANCE', label: 'Посещаемость', color: 'bg-blue-100 text-blue-800' },
    { value: 'GENERAL', label: 'Общее', color: 'bg-gray-100 text-gray-800' }
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Заголовок обязателен';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Заголовок должен содержать минимум 3 символа';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Описание обязательно';
    } else if (formData.content.trim().length < 10) {
      newErrors.content = 'Описание должно содержать минимум 10 символов';
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
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Ошибка при сохранении замечания:', error);
      setErrors({ submit: 'Ошибка при сохранении замечания' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateRemarkData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <FaExclamationTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isEditMode ? 'Редактировать замечание' : 'Добавить замечание'}
              </h2>
              <p className="text-sm text-gray-600">
                Студент: {studentName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Тип замечания */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Тип замечания
            </label>
            <div className="grid grid-cols-2 gap-3">
              {remarkTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleInputChange('type', type.value as any)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    formData.type === type.value
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{type.label}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${type.color}`}>
                      {type.value}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Заголовок */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Заголовок замечания <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Краткое описание замечания"
              maxLength={100}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {formData.title.length}/100 символов
            </p>
          </div>

          {/* Содержание */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              Подробное описание <span className="text-red-500">*</span>
            </label>
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              rows={5}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-vertical ${
                errors.content ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Подробно опишите ситуацию, что произошло, какие меры были приняты..."
              maxLength={1000}
            />
            {errors.content && (
              <p className="mt-1 text-sm text-red-600">{errors.content}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {formData.content.length}/1000 символов
            </p>
          </div>

          {/* Приватность */}
          <div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {formData.isPrivate ? (
                  <FaEyeSlash className="w-5 h-5 text-orange-500" />
                ) : (
                  <FaEye className="w-5 h-5 text-blue-500" />
                )}
                <div>
                  <p className="font-medium text-gray-900">
                    {formData.isPrivate ? 'Приватное замечание' : 'Публичное замечание'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formData.isPrivate 
                      ? 'Видно только администрации и преподавателям'
                      : 'Видно всем участникам образовательного процесса'
                    }
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleInputChange('isPrivate', !formData.isPrivate)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.isPrivate ? 'bg-orange-500' : 'bg-blue-500'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.isPrivate ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Ошибка отправки */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Кнопки */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FaExclamationTriangle className="w-4 h-4" />
              )}
              {isEditMode ? 'Сохранить изменения' : 'Добавить замечание'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RemarkModal;
