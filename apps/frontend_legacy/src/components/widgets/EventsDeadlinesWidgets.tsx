import React from 'react';
import { motion } from 'framer-motion';
import { 
  FaCalendarAlt,
  FaClock,
  FaBell,
  FaUsers,
  FaChartLine
} from 'react-icons/fa';

export const UpcomingEventsWidget: React.FC = () => {
  const events = [
    {
      title: 'Родительское собрание',
      date: '2024-03-22',
      time: '18:00',
      location: 'Кабинет 305',
      type: 'meeting'
    },
    {
      title: 'Открытый урок',
      date: '2024-03-23',
      time: '10:00',
      location: 'Кабинет 201',
      type: 'lesson'
    },
    {
      title: 'Школьная олимпиада',
      date: '2024-03-24',
      time: '09:00',
      location: 'Актовый зал',
      type: 'competition'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FaCalendarAlt className="text-purple-500" />
          <span className="text-sm font-medium">Предстоящие события</span>
        </div>
        <span className="text-xs text-gray-500">
          {events.length} событий
        </span>
      </div>
      {events.map((event, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`p-3 rounded-lg ${
            event.type === 'meeting' ? 'bg-blue-50' :
            event.type === 'lesson' ? 'bg-green-50' :
            'bg-purple-50'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{event.title}</span>
            <span className="text-xs text-gray-500">
              {event.date}
            </span>
          </div>
          <div className="text-xs text-gray-500">
            Время: {event.time}
          </div>
          <div className="text-xs text-gray-500">
            Место: {event.location}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export const DeadlineTrackerWidget: React.FC = () => {
  const deadlines = [
    {
      title: 'Сдача отчетов',
      dueDate: '2024-03-22',
      timeLeft: '2 дня',
      status: 'urgent',
      progress: 75
    },
    {
      title: 'Проверка работ',
      dueDate: '2024-03-25',
      timeLeft: '5 дней',
      status: 'normal',
      progress: 30
    },
    {
      title: 'Подготовка материалов',
      dueDate: '2024-03-28',
      timeLeft: '8 дней',
      status: 'upcoming',
      progress: 10
    }
  ];

  return (
    <div className="space-y-4">
      {deadlines.map((deadline, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="p-3 bg-gray-50 rounded-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{deadline.title}</span>
            <span className={`text-xs px-2 py-1 rounded ${
              deadline.status === 'urgent' ? 'bg-red-100 text-red-700' :
              deadline.status === 'normal' ? 'bg-yellow-100 text-yellow-700' :
              'bg-green-100 text-green-700'
            }`}>
              {deadline.timeLeft}
            </span>
          </div>
          <div className="text-xs text-gray-500 mb-2">
            Срок: {deadline.dueDate}
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${deadline.progress}%` }}
              transition={{ duration: 1 }}
              className={`h-full ${
                deadline.status === 'urgent' ? 'bg-red-500' :
                deadline.status === 'normal' ? 'bg-yellow-500' :
                'bg-green-500'
              }`}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Прогресс: {deadline.progress}%
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export const EventReminderWidget: React.FC = () => {
  const reminders = [
    {
      event: 'Педагогический совет',
      time: '2 часа',
      type: 'meeting',
      priority: 'high'
    },
    {
      event: 'Сдача отчетности',
      time: '1 день',
      type: 'deadline',
      priority: 'medium'
    },
    {
      event: 'Школьный концерт',
      time: '3 дня',
      type: 'event',
      priority: 'low'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <FaBell className="text-yellow-500" />
        <span className="text-sm font-medium">Напоминания</span>
      </div>
      {reminders.map((reminder, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`p-3 rounded-lg border-l-4 ${
            reminder.priority === 'high' ? 'border-red-500 bg-red-50' :
            reminder.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' :
            'border-green-500 bg-green-50'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">{reminder.event}</span>
            <span className="text-xs text-gray-500">
              Через {reminder.time}
            </span>
          </div>
          <div className="text-xs text-gray-500">
            Тип: {reminder.type === 'meeting' ? 'Встреча' :
                  reminder.type === 'deadline' ? 'Срок' : 'Событие'}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export const EventAttendanceWidget: React.FC = () => {
  const events = [
    {
      name: 'Родительское собрание',
      expected: 25,
      confirmed: 20,
      date: '2024-03-22'
    },
    {
      name: 'Школьный концерт',
      expected: 150,
      confirmed: 130,
      date: '2024-03-25'
    },
    {
      name: 'Открытый урок',
      expected: 30,
      confirmed: 28,
      date: '2024-03-24'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <FaUsers className="text-blue-500" />
        <span className="text-sm font-medium">Посещаемость мероприятий</span>
      </div>
      {events.map((event, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="p-3 bg-gray-50 rounded-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{event.name}</span>
            <span className="text-xs text-gray-500">{event.date}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>Подтвердили: {event.confirmed}/{event.expected}</span>
            <span>{Math.round((event.confirmed / event.expected) * 100)}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(event.confirmed / event.expected) * 100}%` }}
              transition={{ duration: 1 }}
              className="h-full bg-blue-500"
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export const EventTrendAnalysisWidget: React.FC = () => {
  const trends = [
    {
      category: 'Собрания',
      thisMonth: 8,
      lastMonth: 6,
      trend: 'up',
      attendance: 85
    },
    {
      category: 'Открытые уроки',
      thisMonth: 4,
      lastMonth: 5,
      trend: 'down',
      attendance: 92
    },
    {
      category: 'Мероприятия',
      thisMonth: 3,
      lastMonth: 3,
      trend: 'stable',
      attendance: 78
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <FaChartLine className="text-green-500" />
        <span className="text-sm font-medium">Анализ мероприятий</span>
      </div>
      {trends.map((trend, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="p-3 bg-gray-50 rounded-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{trend.category}</span>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">
                {trend.thisMonth} / {trend.lastMonth}
              </span>
              <span className={`text-xs ${
                trend.trend === 'up' ? 'text-green-500' :
                trend.trend === 'down' ? 'text-red-500' :
                'text-blue-500'
              }`}>
                {trend.trend === 'up' ? '↑' :
                 trend.trend === 'down' ? '↓' : '→'}
              </span>
            </div>
          </div>
          <div className="text-xs text-gray-500 mb-2">
            Средняя посещаемость: {trend.attendance}%
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${trend.attendance}%` }}
              transition={{ duration: 1 }}
              className={`h-full ${
                trend.attendance > 90 ? 'bg-green-500' :
                trend.attendance > 70 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}; 