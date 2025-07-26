import React, { useState } from 'react';
import { X, CheckCircle, XCircle, MessageCircle } from 'lucide-react';
import { type Document } from '../services/edoService';

interface QuickApprovalModalProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (comment?: string) => Promise<void>;
  onReject: (comment: string) => Promise<void>;
  loading?: boolean;
}

const QuickApprovalModal: React.FC<QuickApprovalModalProps> = ({
  document,
  isOpen,
  onClose,
  onApprove,
  onReject,
  loading = false,
}) => {
  const [comment, setComment] = useState('');
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

  const handleApprove = async () => {
    setActionType('approve');
    try {
      await onApprove(comment || undefined);
      handleClose();
    } catch (error) {
      console.error('Ошибка согласования:', error);
    } finally {
      setActionType(null);
    }
  };

  const handleReject = async () => {
    if (!comment.trim()) {
      alert('Комментарий обязателен при отклонении документа');
      return;
    }

    setActionType('reject');
    try {
      await onReject(comment);
      handleClose();
    } catch (error) {
      console.error('Ошибка отклонения:', error);
    } finally {
      setActionType(null);
    }
  };

  const handleClose = () => {
    setComment('');
    setActionType(null);
    onClose();
  };

  if (!isOpen || !document) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Быстрое согласование
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Информация о документе */}
        <div className="p-4 border-b bg-gray-50">
          <h3 className="font-medium text-gray-900 mb-2">{document.title}</h3>
          <div className="space-y-1 text-sm text-gray-600">
            <div>Тип: {document.type}</div>
            {document.createdBy && (
              <div>Создатель: {document.createdBy.name} {document.createdBy.surname}</div>
            )}
            {document.number && <div>Номер: {document.number}</div>}
          </div>
        </div>

        {/* Содержимое */}
        <div className="p-4">
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Краткое содержание:
            </h4>
            <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 max-h-32 overflow-y-auto">
              {document.content ? 
                document.content.length > 200 ? 
                  `${document.content.substring(0, 200)}...` : 
                  document.content
                : 'Нет содержимого'
              }
            </div>
          </div>

          {/* Комментарий */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MessageCircle className="w-4 h-4 inline mr-1" />
              Комментарий
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Введите комментарий (обязательно для отклонения)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              disabled={loading}
            />
          </div>

          {/* Действия */}
          <div className="flex gap-3">
            <button
              onClick={handleReject}
              disabled={loading || !comment.trim()}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 transition-colors flex items-center justify-center gap-2"
            >
              {actionType === 'reject' ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              {actionType === 'reject' ? 'Отклонение...' : 'Отклонить'}
            </button>

            <button
              onClick={handleApprove}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 transition-colors flex items-center justify-center gap-2"
            >
              {actionType === 'approve' ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              {actionType === 'approve' ? 'Согласование...' : 'Согласовать'}
            </button>
          </div>

          <div className="mt-3 text-xs text-gray-500 text-center">
            * При отклонении комментарий обязателен
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickApprovalModal;
