import React, { useState } from 'react';
import { X, Calendar, MapPin, Users, Clock, Upload, Tag, FileText, Globe, AlertCircle } from 'lucide-react';
import { EventCategory, CreateEventForm } from '../../../types/jasLife';
import { getCategoryIcon, getCategoryColor } from '../../../data/mockJasLifeData';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (form: CreateEventForm) => Promise<void>;
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState<CreateEventForm>({
    title: '',
    description: '',
    shortDescription: '',
    date: new Date(),
    location: '',
    category: 'volunteer',
    maxParticipants: undefined,
    volunteerHours: 0,
    isOnline: false,
    tags: [],
    requirements: []
  });
  const [loading, setLoading] = useState(false);
  const [currentTag, setCurrentTag] = useState('');
  const [currentRequirement, setCurrentRequirement] = useState('');

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
        title: '',
        description: '',
        shortDescription: '',
        date: new Date(),
        location: '',
        category: 'volunteer',
        maxParticipants: undefined,
        volunteerHours: 0,
        isOnline: false,
        tags: [],
        requirements: []
      });
      onClose();
    } catch (error) {
      console.error('Failed to create event:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData({ 
        ...formData, 
        tags: [...formData.tags, currentTag.trim()] 
      });
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const addRequirement = () => {
    if (currentRequirement.trim() && !formData.requirements?.includes(currentRequirement.trim())) {
      setFormData({ 
        ...formData, 
        requirements: [...(formData.requirements || []), currentRequirement.trim()] 
      });
      setCurrentRequirement('');
    }
  };

  const removeRequirement = (reqToRemove: string) => {
    setFormData({
      ...formData,
      requirements: formData.requirements?.filter(req => req !== reqToRemove) || []
    });
  };

  const formatDateTime = (date: Date) => {
    const pad = (num: number) => num.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const parseDateTime = (dateString: string) => {
    return new Date(dateString);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Создать событие</h2>
              <p className="text-sm text-gray-600">Организуйте новое мероприятие для сообщества</p>
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
          {/* Title and Short Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Название события *
              </label>
              <input
                type="text"
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Хакатон AI4Good"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 transition-all"
                maxLength={100}
              />
            </div>

            <div>
              <label htmlFor="shortDescription" className="block text-sm font-medium text-gray-700 mb-2">
                Краткое описание *
              </label>
              <input
                type="text"
                id="shortDescription"
                required
                value={formData.shortDescription}
                onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                placeholder="Создаем AI для добрых дел"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 transition-all"
                maxLength={150}
              />
            </div>
          </div>

          {/* Full Description */}
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Полное описание *
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <textarea
                id="description"
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Подробно опишите ваше мероприятие..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 transition-all resize-none"
                rows={4}
                maxLength={2000}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {formData.description.length}/2000 символов
            </div>
          </div>

          {/* Date, Time, Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                Дата и время *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="datetime-local"
                  id="date"
                  required
                  value={formatDateTime(formData.date)}
                  min={formatDateTime(new Date())}
                  onChange={(e) => setFormData({ ...formData, date: parseDateTime(e.target.value) })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Место проведения *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  id="location"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="IT Lab, корпус 1"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Category, Max Participants, Volunteer Hours */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
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
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 transition-all appearance-none bg-white"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {getCategoryIcon(cat.value)} {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="maxParticipants" className="block text-sm font-medium text-gray-700 mb-2">
                Макс. участников
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  id="maxParticipants"
                  min="1"
                  max="1000"
                  value={formData.maxParticipants || ''}
                  onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="Без лимита"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="volunteerHours" className="block text-sm font-medium text-gray-700 mb-2">
                Волонтерские часы
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  id="volunteerHours"
                  min="0"
                  max="24"
                  step="0.5"
                  value={formData.volunteerHours}
                  onChange={(e) => setFormData({ ...formData, volunteerHours: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Online Event Toggle */}
          <div className="mb-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isOnline"
                checked={formData.isOnline}
                onChange={(e) => setFormData({ ...formData, isOnline: e.target.checked })}
                className="rounded border-gray-300 text-violet-600 shadow-sm focus:border-violet-300 focus:ring focus:ring-violet-200 focus:ring-opacity-50"
              />
              <label htmlFor="isOnline" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Globe className="w-4 h-4" />
                Онлайн-мероприятие
              </label>
            </div>
          </div>

          {/* Tags */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Теги
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-sm"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-violet-500 hover:text-violet-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Добавить тег"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 transition-all text-sm"
                maxLength={20}
              />
              <button
                type="button"
                onClick={addTag}
                className="px-3 py-2 bg-violet-100 text-violet-700 rounded-lg hover:bg-violet-200 transition-colors text-sm"
              >
                Добавить
              </button>
            </div>
          </div>

          {/* Requirements */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Требования к участникам
            </label>
            <div className="space-y-2 mb-2">
              {formData.requirements?.map((req, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                >
                  <span className="text-sm text-gray-700">• {req}</span>
                  <button
                    type="button"
                    onClick={() => removeRequirement(req)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={currentRequirement}
                onChange={(e) => setCurrentRequirement(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                placeholder="Например: Ноутбук, базовые знания программирования"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 transition-all text-sm"
                maxLength={100}
              />
              <button
                type="button"
                onClick={addRequirement}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                Добавить
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="mb-6 p-4 bg-violet-50 rounded-xl">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-violet-800 mb-1">
                  Информация
                </h4>
                <ul className="text-xs text-violet-700 space-y-1">
                  <li>• После создания события автоматически генерируется QR-код</li>
                  <li>• Участники смогут регистрироваться через QR-код или кнопку</li>
                  <li>• Волонтерские часы начисляются автоматически при посещении</li>
                  <li>• Вы можете редактировать событие до его начала</li>
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
              disabled={loading || !formData.title.trim() || !formData.description.trim()}
              className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                loading || !formData.title.trim() || !formData.description.trim()
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700 hover:shadow-lg'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                  Создание...
                </div>
              ) : (
                'Создать событие'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEventModal;
