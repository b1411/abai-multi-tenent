import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { StudentComment } from '../services/studentService';

interface DeleteCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  comment: StudentComment | null;
  studentName: string;
}

export const DeleteCommentModal: React.FC<DeleteCommentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  comment,
  studentName
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      await onConfirm();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка при удалении комментария');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen || !comment) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <AlertTriangle className="w-6 h-6 text-red-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">
              Удалить комментарий
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              Вы действительно хотите удалить этот комментарий?
            </p>
            
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <p className="text-sm text-gray-600">
                <strong>Студент:</strong> {studentName}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Автор:</strong> {comment.teacher.name}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Дата создания:</strong> {new Date(comment.createdAt).toLocaleString('ru-RU')}
              </p>
              <div className="mt-3">
                <p className="text-sm text-gray-600 font-medium mb-1">Содержание:</p>
                <div className="bg-white p-3 rounded border text-sm">
                  {comment.content.length > 150 
                    ? `${comment.content.substring(0, 150)}...` 
                    : comment.content
                  }
                </div>
              </div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6">
            <p className="text-sm text-red-700">
              <strong>Внимание!</strong> Это действие необратимо. Комментарий будет удален навсегда.
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              onClick={handleConfirm}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Удаление...
                </>
              ) : (
                'Удалить'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
