import React, { useState, useEffect } from 'react';
import { X, Send, Users, User } from 'lucide-react';
import { edoService, type Document, type User as UserType } from '../services/edoService';

interface SendForApprovalModalProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
  onSend: (approverIds: number[]) => Promise<void>;
  loading?: boolean;
}

const SendForApprovalModal: React.FC<SendForApprovalModalProps> = ({
  document,
  isOpen,
  onClose,
  onSend,
  loading = false,
}) => {
  const [approvers, setApprovers] = useState<UserType[]>([]);
  const [selectedApprovers, setSelectedApprovers] = useState<number[]>([]);
  const [loadingApprovers, setLoadingApprovers] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchApprovers();
    }
  }, [isOpen]);

  const fetchApprovers = async () => {
    try {
      setLoadingApprovers(true);
      const data = await edoService.getApprovers();
      setApprovers(data || []);
    } catch (error) {
      console.error('Ошибка загрузки согласующих:', error);
    } finally {
      setLoadingApprovers(false);
    }
  };

  const handleApproverToggle = (approverId: number) => {
    setSelectedApprovers(prev => 
      prev.includes(approverId)
        ? prev.filter(id => id !== approverId)
        : [...prev, approverId]
    );
  };

  const handleSend = async () => {
    if (selectedApprovers.length === 0) {
      alert('Выберите хотя бы одного согласующего');
      return;
    }

    setActionLoading(true);
    try {
      await onSend(selectedApprovers);
      handleClose();
    } catch (error) {
      console.error('Ошибка отправки на согласование:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedApprovers([]);
    onClose();
  };

  if (!isOpen || !document) return null;

  const availableApprovers = approvers.filter(user => 
    ['ADMIN', 'HR', 'TEACHER'].includes(user.role)
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Send className="w-5 h-5" />
            Отправить на согласование
          </h2>
          <button
            onClick={handleClose}
            disabled={loading || actionLoading}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Информация о документе */}
        <div className="p-4 border-b bg-gray-50">
          <h3 className="font-medium text-gray-900 mb-1">{document.title}</h3>
          <div className="text-sm text-gray-600">
            Тип: {edoService.getTypeText(document.type)}
          </div>
          {document.number && (
            <div className="text-sm text-gray-600">
              Номер: {document.number}
            </div>
          )}
        </div>

        {/* Выбор согласующих */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              Выберите согласующих ({selectedApprovers.length} выбрано)
            </span>
          </div>

          {loadingApprovers ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Загрузка пользователей...</p>
            </div>
          ) : availableApprovers.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">Нет доступных согласующих</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {availableApprovers.map((approver) => (
                <label
                  key={approver.id}
                  className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedApprovers.includes(approver.id)}
                    onChange={() => handleApproverToggle(approver.id)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    disabled={actionLoading}
                  />
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {approver.name} {approver.surname}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {approver.email}
                      </p>
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded flex-shrink-0">
                      {approver.role}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          )}

          {/* Информация */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700">
              💡 Документ будет отправлен на согласование выбранным пользователям в указанном порядке. 
              После согласования всех участников документ получит статус "Согласован".
            </p>
          </div>

          {/* Действия */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleClose}
              disabled={actionLoading}
              className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleSend}
              disabled={selectedApprovers.length === 0 || actionLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors flex items-center justify-center gap-2"
            >
              {actionLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="w-4 h-4" />
              )}
              {actionLoading ? 'Отправка...' : 'Отправить'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendForApprovalModal;
