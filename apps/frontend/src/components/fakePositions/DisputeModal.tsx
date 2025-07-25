import React, { useState } from 'react';
import { FaTimes, FaUpload, FaSpinner } from 'react-icons/fa';
import { AttendanceRecord, DisputeFormData } from '../../types/fakePositions';
import { useFakePositionsActions } from '../../hooks/useFakePositionsActions';

interface DisputeModalProps {
  record: AttendanceRecord | null;
  onClose: () => void;
  onSuccess: () => void;
}

const DisputeModal: React.FC<DisputeModalProps> = ({
  record,
  onClose,
  onSuccess
}) => {
  const { submitDispute, loading, error } = useFakePositionsActions();
  const [formData, setFormData] = useState<Partial<DisputeFormData>>({
    reason: 'technical_error',
    description: '',
    attachments: []
  });

  if (!record) return null;

  const reasonOptions = [
    { value: 'technical_error', label: 'Техническая ошибка системы' },
    { value: 'illness', label: 'Болезнь/Больничный' },
    { value: 'substitution', label: 'Замещение другим преподавателем' },
    { value: 'other', label: 'Другая причина' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description?.trim()) {
      alert('Пожалуйста, опишите причину спора');
      return;
    }

    const disputeData: DisputeFormData = {
      recordId: record.id,
      reason: formData.reason as any,
      description: formData.description,
      attachments: formData.attachments
    };

    const success = await submitDispute(disputeData);
    if (success) {
      onSuccess();
      onClose();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({
      ...prev,
      attachments: files
    }));
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments?.filter((_, i) => i !== index) || []
    }));
  };

  const getReasonDescription = (reason: string) => {
    switch (reason) {
      case 'technical_error':
        return 'Сообщите о технических проблемах с QR-сканером или системой распознавания лиц';
      case 'illness':
        return 'Приложите справку о болезни или документы, подтверждающие отсутствие';
      case 'substitution':
        return 'Укажите, кто проводил урок вместо вас и причину замещения';
      case 'other':
        return 'Опишите подробно причину несоответствия данных';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="p-3 sm:p-4 lg:p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                Подача спора
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Оспаривание записи о посещаемости
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <FaTimes className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Record Info */}
        <div className="p-3 sm:p-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-xs sm:text-sm font-medium text-gray-900 mb-2">
            Данные записи для оспаривания:
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
            <div>
              <span className="text-gray-500">Дата:</span>
              <span className="ml-2 font-medium">
                {new Date(record.date).toLocaleDateString('ru-RU')}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Урок:</span>
              <span className="ml-2 font-medium">{record.lesson} урок</span>
            </div>
            <div>
              <span className="text-gray-500">Время:</span>
              <span className="ml-2 font-medium">{record.time}</span>
            </div>
            <div>
              <span className="text-gray-500">Предмет:</span>
              <span className="ml-2 font-medium">{record.subject}</span>
            </div>
            <div>
              <span className="text-gray-500">Аудитория:</span>
              <span className="ml-2 font-medium">{record.room}</span>
            </div>
            <div>
              <span className="text-gray-500">Статус:</span>
              <span className={`ml-2 font-medium ${
                record.status === 'confirmed' ? 'text-green-600' :
                record.status === 'mismatch' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {record.status === 'confirmed' ? 'Подтверждено' :
                 record.status === 'mismatch' ? 'Несовпадение' : 'Неявка'}
              </span>
            </div>
          </div>
          {record.comment && (
            <div className="mt-3">
              <span className="text-gray-500 text-sm">Системный комментарий:</span>
              <p className="text-sm text-gray-700 bg-white p-2 rounded mt-1">
                {record.comment}
              </p>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Reason Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Причина оспаривания *
            </label>
            <div className="space-y-3">
              {reasonOptions.map((option) => (
                <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="reason"
                    value={option.value}
                    checked={formData.reason === option.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value as any }))}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {option.label}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {getReasonDescription(option.value)}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Подробное описание *
            </label>
            <textarea
              id="description"
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Опишите подробно ситуацию и причины несоответствия данных..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Минимум 20 символов. Укажите все важные детали.
            </p>
          </div>

          {/* File Attachments */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Прикрепить документы (необязательно)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <FaUpload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Нажмите для выбора файлов
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PDF, DOC, DOCX, JPG, PNG до 5MB каждый
                </p>
              </label>
            </div>

            {/* Selected Files */}
            {formData.attachments && formData.attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {formData.attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm text-gray-700 truncate">
                      {file.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700 ml-2"
                    >
                      <FaTimes className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              disabled={loading || !formData.description?.trim()}
            >
              {loading && <FaSpinner className="w-4 h-4 animate-spin" />}
              {loading ? 'Отправка...' : 'Отправить спор'}
            </button>
          </div>
        </form>

        {/* Info */}
        <div className="px-6 pb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              <strong>Обратите внимание:</strong> После подачи спора запись будет помечена как "На рассмотрении". 
              Администрация рассмотрит ваш спор в течение 2-3 рабочих дней. 
              О результатах рассмотрения вы будете уведомлены.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisputeModal;
