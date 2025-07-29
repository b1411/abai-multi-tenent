import React from 'react';
import { FaChalkboardTeacher, FaCalendarAlt, FaClock } from 'react-icons/fa';
import { AttendanceRecord } from '../../types/fakePositions';
import { useAuth } from '../../hooks/useAuth';
import StatusBadge from './StatusBadge';

interface YourLessonsSectionProps {
  data: AttendanceRecord[];
  onDisputeClick: (record: AttendanceRecord) => void;
  onCheckInClick: (record: AttendanceRecord) => void;
}

const YourLessonsSection: React.FC<YourLessonsSectionProps> = ({
  data,
  onDisputeClick,
  onCheckInClick
}) => {
  const { user } = useAuth();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    if (isToday) {
      return 'Сегодня';
    }
    
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  const isCurrentLesson = (record: AttendanceRecord) => {
    const now = new Date();
    const today = now.toDateString();
    const recordDate = new Date(record.date).toDateString();
    
    if (today !== recordDate) return false;
    
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [startTime] = record.time.split('-');
    const [hours, minutes] = startTime.split(':').map(Number);
    const lessonStartTime = hours * 60 + minutes;
    const lessonEndTime = lessonStartTime + 45; // Предполагаем 45-минутный урок
    
    return currentTime >= lessonStartTime - 10 && currentTime <= lessonEndTime + 5;
  };

  const canCheckIn = (record: AttendanceRecord) => {
    const now = new Date();
    const today = now.toDateString();
    const recordDate = new Date(record.date).toDateString();
    
    if (today !== recordDate) return false;
    
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [startTime] = record.time.split('-');
    const [hours, minutes] = startTime.split(':').map(Number);
    const lessonStartTime = hours * 60 + minutes;
    
    // Доступно за 10 минут до и 5 минут после начала урока
    const checkInStart = lessonStartTime - 10;
    const checkInEnd = lessonStartTime + 5;
    
    return currentTime >= checkInStart && currentTime <= checkInEnd && !record.qrScanned;
  };

  const getTimeUntilCheckIn = (record: AttendanceRecord): string | null => {
    const now = new Date();
    const today = now.toDateString();
    const recordDate = new Date(record.date).toDateString();
    
    if (today !== recordDate) return null;
    
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [startTime] = record.time.split('-');
    const [hours, minutes] = startTime.split(':').map(Number);
    const lessonStartTime = hours * 60 + minutes;
    const checkInStart = lessonStartTime - 10;
    
    if (currentTime < checkInStart) {
      const timeLeft = checkInStart - currentTime;
      return `через ${timeLeft} мин`;
    }
    
    return null;
  };

  const todayLessons = data.filter(record => {
    const today = new Date().toDateString();
    const recordDate = new Date(record.date).toDateString();
    return today === recordDate;
  });

  const upcomingLessons = data.filter(record => {
    const today = new Date();
    const recordDate = new Date(record.date);
    return recordDate > today;
  });

  const pastLessons = data.filter(record => {
    const today = new Date();
    const recordDate = new Date(record.date);
    return recordDate < today;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6">
        <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
          <FaChalkboardTeacher className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
            Ваши занятия
          </h1>
        </div>
        <p className="text-sm sm:text-base text-gray-600">
          Здравствуйте, {user?.name} {user?.surname}. 
          Ниже отображены ваши занятия и их статус посещаемости.
        </p>
      </div>

      {/* Today's Lessons */}
      {todayLessons.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 lg:px-6 py-4 border-b border-gray-200 bg-blue-50">
            <div className="flex items-center space-x-2">
              <FaCalendarAlt className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Сегодняшние занятия
              </h2>
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                {todayLessons.length}
              </span>
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            {todayLessons.map((record) => (
              <div 
                key={record.id} 
                className={`border rounded-lg p-4 transition-all ${
                  isCurrentLesson(record) 
                    ? 'border-blue-300 bg-blue-50 shadow-md' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {record.lesson} урок
                      </h3>
                      {isCurrentLesson(record) && (
                        <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                          Текущий урок
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <FaClock className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{record.time}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Предмет:</span>
                        <span className="ml-1 font-medium">{record.subject}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Аудитория:</span>
                        <span className="ml-1 font-medium">{record.room}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                    <StatusBadge status={record.status} />
                    
                    <div className="flex space-x-2">
                      {canCheckIn(record) ? (
                        <button
                          onClick={() => onCheckInClick(record)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                        >
                          Отметиться
                        </button>
                      ) : (
                        getTimeUntilCheckIn(record) && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-3 py-2 rounded-lg">
                            Отметка {getTimeUntilCheckIn(record)}
                          </span>
                        )
                      )}
                      
                      {record.disputeSubmitted ? (
                        <span className="text-xs text-blue-600 bg-blue-100 px-3 py-2 rounded-lg">
                          На рассмотрении
                        </span>
                      ) : record.canDispute ? (
                        <button
                          onClick={() => onDisputeClick(record)}
                          className="text-blue-600 hover:text-blue-900 text-sm font-medium px-3 py-2 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          Оспорить
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>

                {record.comment && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Комментарий:</span> {record.comment}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Lessons (next few days) */}
      {upcomingLessons.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 lg:px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Предстоящие занятия
            </h2>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingLessons.slice(0, 6).map((record) => (
                <div key={record.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      {formatDate(record.date)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {record.lesson} урок
                    </span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div>{record.time}</div>
                    <div className="font-medium">{record.subject}</div>
                    <div className="text-gray-500">{record.room}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Past Lessons */}
      {pastLessons.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 lg:px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Последние занятия
            </h2>
          </div>
          
          <div className="p-6 space-y-3">
            {pastLessons.slice(0, 10).map((record) => (
              <div key={record.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
                <div className="flex-1 space-y-1 sm:space-y-0">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-900">
                      {formatDate(record.date)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {record.lesson} урок ({record.time})
                    </span>
                    <span className="text-sm font-medium">
                      {record.subject}
                    </span>
                  </div>
                  {record.comment && (
                    <p className="text-xs text-gray-500">{record.comment}</p>
                  )}
                </div>
                
                <div className="flex items-center space-x-3 mt-2 sm:mt-0">
                  <StatusBadge status={record.status} size="sm" />
                  {record.disputeSubmitted ? (
                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                      На рассмотрении
                    </span>
                  ) : record.canDispute ? (
                    <button
                      onClick={() => onDisputeClick(record)}
                      className="text-blue-600 hover:text-blue-900 text-xs font-medium"
                    >
                      Оспорить
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default YourLessonsSection;
