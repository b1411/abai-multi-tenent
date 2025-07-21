import React from 'react';
import { motion } from 'framer-motion';
import { 
  FaEnvelope,
  FaComments,
  FaBell,
  FaCalendarCheck,
  FaUsers
} from 'react-icons/fa';

export const MessagesWidget: React.FC = () => {
  const messages = [
    {
      from: 'Иванова Е.П.',
      role: 'Родитель',
      subject: 'Вопрос по домашнему заданию',
      time: '14:30',
      unread: true
    },
    {
      from: 'Петров С.М.',
      role: 'Учитель',
      subject: 'Материалы к уроку',
      time: '13:45',
      unread: false
    },
    {
      from: 'Администрация',
      role: 'Система',
      subject: 'Важное объявление',
      time: '12:20',
      unread: true
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FaEnvelope className="text-blue-500" />
          <span className="text-sm font-medium">Сообщения</span>
        </div>
        <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full">
          2 новых
        </span>
      </div>
      {messages.map((message, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`p-3 rounded-lg ${message.unread ? 'bg-blue-50' : 'bg-gray-50'}`}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">{message.from}</span>
              <span className="text-xs text-gray-500">{message.role}</span>
            </div>
            <span className="text-xs text-gray-500">{message.time}</span>
          </div>
          <div className="text-sm text-gray-700">{message.subject}</div>
          {message.unread && (
            <div className="mt-2 text-xs text-blue-500">Непрочитано</div>
          )}
        </motion.div>
      ))}
    </div>
  );
};

export const ParentCommunicationWidget: React.FC = () => {
  const communications = [
    {
      parent: 'Иванова Е.П.',
      student: 'Иванов А.',
      lastContact: '2024-03-20',
      status: 'active',
      topics: ['Успеваемость', 'Поведение']
    },
    {
      parent: 'Петрова М.И.',
      student: 'Петров К.',
      lastContact: '2024-03-19',
      status: 'pending',
      topics: ['Домашнее задание']
    },
    {
      parent: 'Сидоров В.А.',
      student: 'Сидорова О.',
      lastContact: '2024-03-18',
      status: 'resolved',
      topics: ['Экскурсия', 'Оплата']
    }
  ];

  return (
    <div className="space-y-4">
      {communications.map((comm, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="p-3 bg-gray-50 rounded-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-sm font-medium">{comm.parent}</div>
              <div className="text-xs text-gray-500">Ученик: {comm.student}</div>
            </div>
            <div className={`text-xs font-medium px-2 py-1 rounded ${
              comm.status === 'active' ? 'bg-green-100 text-green-700' :
              comm.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {comm.status === 'active' ? 'Активно' :
               comm.status === 'pending' ? 'Ожидает' : 'Решено'}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {comm.topics.map((topic, i) => (
              <span
                key={i}
                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
              >
                {topic}
              </span>
            ))}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Последний контакт: {comm.lastContact}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export const NotificationsWidget: React.FC = () => {
  const notifications = [
    {
      title: 'Родительское собрание',
      description: 'Завтра в 18:00, кабинет 305',
      type: 'event',
      time: '2 часа назад'
    },
    {
      title: 'Новый документ',
      description: 'Загружен план на четверть',
      type: 'document',
      time: '3 часа назад'
    },
    {
      title: 'Система',
      description: 'Обновление расписания',
      type: 'system',
      time: '5 часов назад'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <FaBell className="text-yellow-500" />
        <span className="text-sm font-medium">Уведомления</span>
      </div>
      {notifications.map((notification, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`p-3 rounded-lg ${
            notification.type === 'event' ? 'bg-purple-50' :
            notification.type === 'document' ? 'bg-blue-50' :
            'bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">{notification.title}</span>
            <span className="text-xs text-gray-500">{notification.time}</span>
          </div>
          <div className="text-sm text-gray-700">{notification.description}</div>
        </motion.div>
      ))}
    </div>
  );
};

export const MeetingsScheduleWidget: React.FC = () => {
  const meetings = [
    {
      title: 'Родительское собрание 9А',
      date: '2024-03-22',
      time: '18:00',
      location: 'Кабинет 305',
      attendees: 25
    },
    {
      title: 'Педагогический совет',
      date: '2024-03-23',
      time: '15:00',
      location: 'Актовый зал',
      attendees: 15
    },
    {
      title: 'Встреча с психологом',
      date: '2024-03-24',
      time: '14:30',
      location: 'Кабинет 208',
      attendees: 3
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <FaCalendarCheck className="text-green-500" />
        <span className="text-sm font-medium">Расписание встреч</span>
      </div>
      {meetings.map((meeting, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="p-3 bg-gray-50 rounded-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{meeting.title}</span>
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <FaUsers />
              <span>{meeting.attendees}</span>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Дата: {meeting.date} в {meeting.time}
          </div>
          <div className="text-xs text-gray-500">
            Место: {meeting.location}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export const ChatWidget: React.FC = () => {
  const chats = [
    {
      name: 'Учителя 9А',
      lastMessage: 'Обсуждение успеваемости',
      time: '14:30',
      unread: 3,
      members: 8,
      status: 'active'
    },
    {
      name: 'Родительский комитет',
      lastMessage: 'Подготовка к празднику',
      time: '13:45',
      unread: 0,
      members: 12,
      status: 'active'
    },
    {
      name: 'Администрация',
      lastMessage: 'Важное объявление',
      time: '12:20',
      unread: 1,
      members: 5,
      status: 'inactive'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <FaComments className="text-indigo-500" />
        <span className="text-sm font-medium">Групповые чаты</span>
      </div>
      {chats.map((chat, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="p-3 bg-gray-50 rounded-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">{chat.name}</span>
              <span className={`w-2 h-2 rounded-full ${
                chat.status === 'active' ? 'bg-green-500' : 'bg-gray-500'
              }`} />
            </div>
            {chat.unread > 0 && (
              <span className="text-xs bg-indigo-500 text-white px-2 py-1 rounded-full">
                {chat.unread}
              </span>
            )}
          </div>
          <div className="text-sm text-gray-700">{chat.lastMessage}</div>
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>{chat.time}</span>
            <div className="flex items-center space-x-1">
              <FaUsers />
              <span>{chat.members}</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}; 