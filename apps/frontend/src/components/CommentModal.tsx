import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { CreateCommentData, UpdateCommentData, StudentComment } from '../services/studentService';

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCommentData | UpdateCommentData) => Promise<void>;
  comment?: StudentComment;
  studentName: string;
  title: string;
}

export const CommentModal: React.FC<CommentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  comment,
  studentName,
  title
}) => {
  const [formData, setFormData] = useState<CreateCommentData>({
    title: '',
    content: '',
    type: 'GENERAL',
    isPrivate: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (comment) {
      setFormData({
        title: comment.title,
        content: comment.content,
        type: comment.type,
        isPrivate: comment.isPrivate
      });
    } else {
      setFormData({
        title: '',
        content: '',
        type: 'GENERAL',
        isPrivate: true
      });
    }
    setError(null);
  }, [comment, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Заголовок не может быть пустым');
      return;
    }
    
    if (!formData.content.trim()) {
      setError('Комментарий не может быть пустым');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка при сохранении комментария');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof CreateCommentData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {title}
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Студент:</strong> {studentName}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Заголовок <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Введите заголовок комментария..."
              disabled={isSubmitting}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Тип комментария
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value as 'ACADEMIC' | 'GENERAL')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isSubmitting}
            >
              <option value="GENERAL">Общий</option>
              <option value="ACADEMIC">Учебный</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Комментарий <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => handleChange('content', e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Введите комментарий о студенте..."
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="isPrivate"
                  type="checkbox"
                  checked={formData.isPrivate}
                  onChange={(e) => handleChange('isPrivate', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  disabled={isSubmitting}
                />
              </div>
              <div className="ml-3">
                <label htmlFor="isPrivate" className="text-sm font-medium text-yellow-800">
                  Приватный комментарий
                </label>
                <p className="text-xs text-yellow-700 mt-1">
                  Комментарии видны только администрации и не отображаются студентам или родителям.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.title.trim() || !formData.content.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Сохранение...
                </>
              ) : (
                comment ? 'Обновить' : 'Добавить'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
