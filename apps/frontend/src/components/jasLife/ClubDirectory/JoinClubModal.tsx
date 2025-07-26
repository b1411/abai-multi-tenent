import React, { useState } from 'react';
import { X, Users, Star, Calendar, MessageCircle } from 'lucide-react';
import { Club } from '../../../types/jasLife';

interface JoinClubModalProps {
  club: Club | null;
  isOpen: boolean;
  onClose: () => void;
  onJoin: (clubId: string, message: string) => Promise<void>;
}

const JoinClubModal: React.FC<JoinClubModalProps> = ({
  club,
  isOpen,
  onClose,
  onJoin
}) => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !club) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!club) return;

    setLoading(true);
    try {
      await onJoin(club.id, message);
      setMessage('');
      onClose();
    } catch (error) {
      console.error('Failed to join club:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative h-32 overflow-hidden rounded-t-2xl">
          <img
            src={club.logo}
            alt={club.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
          <div className="absolute bottom-4 left-4 text-white">
            <h2 className="text-xl font-bold">{club.name}</h2>
            <p className="text-sm opacity-90">{club.memberCount} участников</p>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Club Info */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-1 text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.floor(club.rating) ? 'fill-current' : 'stroke-current opacity-30'}`} />
                ))}
                <span className="text-sm text-gray-600 ml-2">{club.rating}</span>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getCategoryColor(club.category)} text-white`}>
                {club.category.toUpperCase()}
              </span>
            </div>
            
            <p className="text-gray-600 text-sm mb-4">
              {club.description}
            </p>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-violet-600" />
                <span>{club.memberCount} участников</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-violet-600" />
                <span>{club.events.length} событий</span>
              </div>
            </div>

            {/* Leader Info */}
            <div className="mt-4 p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <img
                  src={club.leader.avatar}
                  alt={club.leader.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <div className="font-medium text-gray-900">
                    {club.leader.name} {club.leader.surname}
                  </div>
                  <div className="text-sm text-gray-600">Лидер клуба</div>
                </div>
              </div>
            </div>

            {/* Social Links */}
            {club.socialLinks && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Социальные сети:</h4>
                <div className="flex gap-2">
                  {club.socialLinks.telegram && (
                    <a
                      href={`https://t.me/${club.socialLinks.telegram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors"
                    >
                      {club.socialLinks.telegram}
                    </a>
                  )}
                  {club.socialLinks.instagram && (
                    <a
                      href={`https://instagram.com/${club.socialLinks.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-pink-100 text-pink-700 rounded-lg text-sm hover:bg-pink-200 transition-colors"
                    >
                      {club.socialLinks.instagram}
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Join Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Сообщение для лидера клуба (необязательно)
              </label>
              <div className="relative">
                <MessageCircle className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Расскажите, почему хотите вступить в клуб..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 transition-all resize-none"
                  rows={3}
                  maxLength={500}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {message.length}/500 символов
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
                disabled={loading}
                className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                  loading
                    ? 'bg-violet-100 text-violet-600 cursor-wait'
                    : 'bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700 hover:shadow-lg'
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                    Отправка...
                  </div>
                ) : (
                  'Подать заявку'
                )}
              </button>
            </div>
          </form>

          {/* Info */}
          <div className="mt-4 p-3 bg-blue-50 rounded-xl">
            <p className="text-xs text-blue-800">
              💡 После подачи заявки лидер клуба рассмотрит вашу кандидатуру. 
              Вы получите уведомление о принятом решении.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function for category colors
const getCategoryColor = (category: string): string => {
  const colors = {
    academic: 'from-blue-400 to-blue-600',
    sports: 'from-orange-400 to-red-500',
    creative: 'from-pink-400 to-rose-500',
    volunteer: 'from-green-400 to-emerald-500',
    professional: 'from-purple-400 to-indigo-600',
    hobby: 'from-yellow-400 to-orange-500',
    social: 'from-cyan-400 to-blue-500',
    environmental: 'from-green-500 to-teal-600'
  };
  return colors[category as keyof typeof colors] || 'from-gray-400 to-gray-600';
};

export default JoinClubModal;
