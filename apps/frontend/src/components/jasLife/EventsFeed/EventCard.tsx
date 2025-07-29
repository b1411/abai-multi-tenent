import React, { useState } from 'react';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Heart, 
  MessageCircle, 
  Share2,
  ExternalLink,
  CheckCircle,
  Globe,
  User,
  Star,
  QrCode
} from 'lucide-react';
import { Event } from '../../../types/jasLife';
import { getCategoryColor, getCategoryIcon } from '../../../data/mockJasLifeData';
import QRGenerator from '../QRSystem/QRGenerator';

interface EventCardProps {
  event: Event;
  onRegister?: (eventId: string) => void;
  onLike?: (eventId: string) => void;
  onComment?: (eventId: string) => void;
  onShare?: (eventId: string) => void;
  isRegistered?: boolean;
  isLiked?: boolean;
  loading?: boolean;
  isOrganizer?: boolean;
}

const EventCard: React.FC<EventCardProps> = ({
  event,
  onRegister,
  onLike,
  onComment,
  onShare,
  isRegistered = false,
  isLiked = false,
  loading = false,
  isOrganizer = false
}) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatDuration = () => {
    if (!event.endDate) return null;
    const duration = (event.endDate.getTime() - event.date.getTime()) / (1000 * 60 * 60);
    return `${Math.round(duration)} ч`;
  };

  const spotsLeft = event.maxParticipants ? event.maxParticipants - event.currentParticipants : null;
  const isFull = spotsLeft !== null && spotsLeft <= 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group">
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        {!imageError ? (
          <img
            src={event.image}
            alt={event.title}
            className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
              imageLoading ? 'opacity-0' : 'opacity-100'
            }`}
            onLoad={() => setImageLoading(false)}
            onError={() => {
              setImageError(true);
              setImageLoading(false);
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
            <div className="text-6xl opacity-50">
              {getCategoryIcon(event.category)}
            </div>
          </div>
        )}
        
        {/* Category Badge */}
        <div className="absolute top-4 left-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium text-white bg-gradient-to-r ${getCategoryColor(event.category)} shadow-lg`}>
            {getCategoryIcon(event.category)} {event.category.toUpperCase()}
          </span>
        </div>

        {/* Online Badge */}
        {event.isOnline && (
          <div className="absolute top-4 right-4">
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500 text-white flex items-center gap-1">
              <Globe className="w-3 h-3" />
              Online
            </span>
          </div>
        )}

        {/* Status Badge */}
        {event.status !== 'upcoming' && (
          <div className="absolute bottom-4 right-4">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              event.status === 'ongoing' 
                ? 'bg-green-500 text-white' 
                : event.status === 'completed'
                ? 'bg-gray-500 text-white'
                : 'bg-red-500 text-white'
            }`}>
              {event.status === 'ongoing' && '🔴 В эфире'}
              {event.status === 'completed' && '✅ Завершено'}
              {event.status === 'cancelled' && '❌ Отменено'}
            </span>
          </div>
        )}

        {/* Loading overlay */}
        {imageLoading && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-bold text-gray-900 line-clamp-2 group-hover:text-purple-600 transition-colors">
            {event.title}
          </h3>
          <div className="flex items-center gap-1 text-yellow-500 ml-2">
            <Star className="w-4 h-4 fill-current" />
            <span className="text-sm font-medium">{event.likes}</span>
          </div>
        </div>

        {/* Short Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {event.shortDescription}
        </p>

        {/* Event Details */}
        <div className="space-y-2 mb-4">
          {/* Date & Time */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4 text-purple-500" />
            <span>{formatDate(event.date)}</span>
            {formatDuration() && (
              <>
                <Clock className="w-4 h-4 text-purple-500 ml-2" />
                <span>{formatDuration()}</span>
              </>
            )}
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-purple-500" />
            <span className="truncate">{event.location}</span>
          </div>

          {/* Organizer */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="w-4 h-4 text-purple-500" />
            <span className="truncate">{event.organizer.name}</span>
          </div>

          {/* Participants */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="w-4 h-4 text-purple-500" />
            <span>
              {event.currentParticipants} участников
              {event.maxParticipants && ` из ${event.maxParticipants}`}
            </span>
            {spotsLeft !== null && (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                isFull 
                  ? 'bg-red-100 text-red-700' 
                  : spotsLeft <= 5 
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-green-100 text-green-700'
              }`}>
                {isFull ? 'Мест нет' : `${spotsLeft} мест`}
              </span>
            )}
          </div>

          {/* Volunteer Hours */}
          {event.volunteerHours > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">V</span>
              </div>
              <span className="text-green-600 font-medium">
                +{event.volunteerHours} волонтерских часов
              </span>
            </div>
          )}
        </div>

        {/* Tags */}
        {event.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {event.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full hover:bg-purple-100 hover:text-purple-700 transition-colors cursor-pointer"
              >
                #{tag}
              </span>
            ))}
            {event.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                +{event.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          {/* Social Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => onLike?.(event.id)}
              className={`flex items-center gap-1 text-sm transition-colors ${
                isLiked 
                  ? 'text-red-500 hover:text-red-600' 
                  : 'text-gray-500 hover:text-red-500'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>{event.likes}</span>
            </button>

            <button
              onClick={() => onComment?.(event.id)}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-purple-600 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{event.comments.length}</span>
            </button>

            <button
              onClick={() => onShare?.(event.id)}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* QR Code Button for Organizers */}
            {isOrganizer && (
              <button
                onClick={() => setQrModalOpen(true)}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-violet-600 transition-colors"
                title="Генерировать QR-код"
              >
                <QrCode className="w-4 h-4" />
                <span className="hidden sm:inline">QR</span>
              </button>
            )}
          </div>

          {/* Registration Button */}
          <div className="flex items-center gap-2">
            {isRegistered ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-xl text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                Зарегистрирован
              </div>
            ) : (
              <button
                onClick={() => onRegister?.(event.id)}
                disabled={loading || isFull || event.status !== 'upcoming'}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  isFull || event.status !== 'upcoming'
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : loading
                    ? 'bg-purple-100 text-purple-600 cursor-wait'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 hover:shadow-lg transform hover:-translate-y-0.5'
                }`}
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                ) : isFull ? (
                  'Мест нет'
                ) : event.status !== 'upcoming' ? (
                  'Недоступно'
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4" />
                    Участвовать
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* QR Generator Modal */}
      <QRGenerator
        event={event}
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
      />
    </div>
  );
};

export default EventCard;
