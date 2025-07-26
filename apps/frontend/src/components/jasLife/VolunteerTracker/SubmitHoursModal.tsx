import React, { useState } from 'react';
import { X, Clock, Upload, Calendar, Tag, FileText, AlertCircle } from 'lucide-react';
import { EventCategory, SubmitHoursForm } from '../../../types/jasLife';
import { getCategoryIcon, getCategoryColor } from '../../../data/mockJasLifeData';

interface SubmitHoursModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (form: SubmitHoursForm) => Promise<void>;
}

const SubmitHoursModal: React.FC<SubmitHoursModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState<SubmitHoursForm>({
    description: '',
    hours: 1,
    date: new Date(),
    category: 'volunteer',
    eventId: undefined,
    evidence: undefined
  });
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  if (!isOpen) return null;

  const categories: { value: EventCategory; label: string }[] = [
    { value: 'volunteer', label: 'Волонтерство' },
    { value: 'charity', label: 'Благотворительность' },
    { value: 'environment', label: 'Экология' },
    { value: 'education', label: 'Образование' },
    { value: 'social', label: 'Социальная работа' },
    { value: 'culture', label: 'Культура' },
    { value: 'sport', label: 'Спорт' },
    { value: 'science', label: 'Наука' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await onSubmit(formData);
      // Reset form
      setFormData({
        description: '',
        hours: 1,
        date: new Date(),
        category: 'volunteer',
        eventId: undefined,
        evidence: undefined
      });
      onClose();
    } catch (error) {
      console.error('Failed to submit hours:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, evidence: file });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setFormData({ ...formData, evidence: file });
    }
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const parseDate = (dateString: string) => {
    return new Date(dateString + 'T00:00:00');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Подать волонтерские часы</h2>
              <p className="text-sm text-gray-600">Опишите вашу волонтерскую деятельность</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Description */}
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Описание деятельности *
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <textarea
                id="description"
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Опишите, какую волонтерскую работу вы выполняли..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-300 transition-all resize-none"
                rows={3}
                maxLength={1000}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {formData.description.length}/1000 символов
            </div>
          </div>

          {/* Hours and Date */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="hours" className="block text-sm font-medium text-gray-700 mb-2">
                Количество часов *
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  id="hours"
                  required
                  min="0.5"
                  max="24"
                  step="0.5"
                  value={formData.hours}
                  onChange={(e) => setFormData({ ...formData, hours: parseFloat(e.target.value) })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-300 transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                Дата *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  id="date"
                  required
                  value={formatDate(formData.date)}
                  max={formatDate(new Date())}
                  onChange={(e) => setFormData({ ...formData, date: parseDate(e.target.value) })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-300 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Category */}
          <div className="mb-4">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Категория *
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                id="category"
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as EventCategory })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-300 transition-all appearance-none bg-white"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {getCategoryIcon(cat.value)} {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Evidence Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Подтверждающие документы (необязательно)
            </label>
            <div
              className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                dragActive
                  ? 'border-green-400 bg-green-50'
                  : formData.evidence
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={() => setDragActive(true)}
              onDragLeave={() => setDragActive(false)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              
              {formData.evidence ? (
                <div className="flex items-center justify-center gap-2">
                  <Upload className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-700">
                    {formData.evidence.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, evidence: undefined })}
                    className="text-red-500 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div>
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-1">
                    Перетащите файл сюда или нажмите для выбора
                  </p>
                  <p className="text-xs text-gray-500">
                    Поддерживаются: изображения, PDF, DOC, DOCX (макс. 10 МБ)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="mb-6 p-4 bg-amber-50 rounded-xl">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-amber-800 mb-1">
                  Важная информация
                </h4>
                <ul className="text-xs text-amber-700 space-y-1">
                  <li>• Все подаваемые часы проверяются администратором</li>
                  <li>• Приложите подтверждающие документы для быстрого одобрения</li>
                  <li>• Максимум 8 часов в день можно подать</li>
                  <li>• Часы можно подавать только за прошедшие даты</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading || !formData.description.trim()}
              className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                loading || !formData.description.trim()
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 hover:shadow-lg'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                  Отправка...
                </div>
              ) : (
                'Подать часы'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitHoursModal;
