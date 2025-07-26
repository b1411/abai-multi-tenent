import React from 'react';
import { Alumni, AlumniStatus } from '../types/alumni';
import { 
  User, 
  MapPin, 
  Building, 
  Mail, 
  Phone, 
  GraduationCap, 
  Calendar,
  Briefcase,
  Award,
  ExternalLink,
  Star
} from 'lucide-react';

interface AlumniCardProps {
  alumni: Alumni;
  onClick?: (alumni: Alumni) => void;
  className?: string;
}

const AlumniCard: React.FC<AlumniCardProps> = ({ 
  alumni, 
  onClick,
  className = ''
}) => {
  const getStatusColor = (status: AlumniStatus) => {
    switch (status) {
      case AlumniStatus.ACTIVE:
        return 'bg-green-100 text-green-800';
      case AlumniStatus.INACTIVE:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: AlumniStatus) => {
    switch (status) {
      case AlumniStatus.ACTIVE:
        return 'Активный';
      case AlumniStatus.INACTIVE:
        return 'Неактивный';
      default:
        return 'Неизвестно';
    }
  };

  const formatGraduationDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long'
    });
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6 ${
        onClick ? 'cursor-pointer hover:bg-gray-50' : ''
      } ${className}`}
      onClick={() => onClick?.(alumni)}
    >
      {/* Заголовок карточки */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {/* Аватар */}
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
            {alumni.avatar ? (
              <img 
                src={alumni.avatar} 
                alt={`${alumni.name} ${alumni.surname}`}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              `${alumni.name[0]}${alumni.surname[0]}`
            )}
          </div>
          
          {/* Имя и основная информация */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {alumni.name} {alumni.surname}
              {alumni.middlename && ` ${alumni.middlename}`}
            </h3>
            <div className="flex items-center text-sm text-gray-600">
              <GraduationCap className="h-4 w-4 mr-1" />
              <span>{alumni.groupName}</span>
            </div>
          </div>
        </div>

        {/* Статус */}
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(alumni.status)}`}>
          {getStatusText(alumni.status)}
        </span>
      </div>

      {/* Дата выпуска */}
      <div className="flex items-center text-sm text-gray-600 mb-3">
        <Calendar className="h-4 w-4 mr-2" />
        <span>Выпуск: {formatGraduationDate(alumni.graduationDate)}</span>
      </div>

      {/* Текущая работа */}
      {alumni.currentCompany && (
        <div className="mb-3">
          <div className="flex items-center text-sm text-gray-700 mb-1">
            <Building className="h-4 w-4 mr-2" />
            <span className="font-medium">{alumni.currentCompany}</span>
          </div>
          {alumni.currentJob && (
            <div className="flex items-center text-sm text-gray-600 ml-6">
              <Briefcase className="h-4 w-4 mr-2" />
              <span>{alumni.currentJob}</span>
            </div>
          )}
          {alumni.industry && (
            <div className="ml-6 mt-1">
              <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                {alumni.industry}
              </span>
            </div>
          )}
        </div>
      )}

      {/* GPA */}
      {alumni.gpa && (
        <div className="flex items-center text-sm text-gray-600 mb-3">
          <Star className="h-4 w-4 mr-2" />
          <span>GPA: {alumni.gpa}</span>
        </div>
      )}

      {/* Достижения */}
      {alumni.achievements && alumni.achievements.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <Award className="h-4 w-4 mr-2" />
            <span className="font-medium">Достижения:</span>
          </div>
          <div className="ml-6 space-y-1">
            {alumni.achievements.slice(0, 2).map((achievement, index) => (
              <div key={index} className="text-sm text-gray-600">
                • {achievement}
              </div>
            ))}
            {alumni.achievements.length > 2 && (
              <div className="text-sm text-gray-500">
                и еще {alumni.achievements.length - 2}...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Контактная информация */}
      <div className="border-t pt-3 mt-3">
        <div className="flex flex-wrap gap-3">
          {alumni.email && (
            <a
              href={`mailto:${alumni.email}`}
              className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors min-w-0"
              onClick={(e) => e.stopPropagation()}
            >
              <Mail className="h-4 w-4 mr-1 flex-shrink-0" />
              <span className="truncate">{alumni.email}</span>
            </a>
          )}
          {alumni.phone && (
            <a
              href={`tel:${alumni.phone}`}
              className="flex items-center text-sm text-green-600 hover:text-green-800 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Phone className="h-4 w-4 mr-1" />
              <span>{alumni.phone}</span>
            </a>
          )}
          {alumni.linkedin && (
            <a
              href={alumni.linkedin.startsWith('http') ? alumni.linkedin : `https://${alumni.linkedin}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              <span>LinkedIn</span>
            </a>
          )}
        </div>
      </div>

      {/* Футер с датой обновления */}
      <div className="text-xs text-gray-500 mt-3 pt-2 border-t">
        Обновлено: {new Date(alumni.updatedAt).toLocaleDateString('ru-RU')}
      </div>
    </div>
  );
};

export default AlumniCard;
