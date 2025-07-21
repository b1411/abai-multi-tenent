import React from 'react';
import { motion } from 'framer-motion';
import {
  FaGraduationCap,
  FaChartLine,
  FaUsers,
  FaShieldAlt,
  FaRobot,
  FaComments,
  FaTasks,
  FaCalendarAlt,
  FaTimes
} from 'react-icons/fa';

interface AddWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWidget: (category: string, widgetName: string) => void;
}

const categories = [
  {
    id: 'education',
    name: 'Образование',
    icon: <FaGraduationCap />,
    color: 'bg-blue-500',
    widgets: [
      'Успеваемость по классам',
      'Прогресс по программе',
      'Топ студентов',
      'Активность преподавателей',
      'Динамика посещаемости'
    ]
  },
  {
    id: 'finance',
    name: 'Финансы',
    icon: <FaChartLine />,
    color: 'bg-green-500',
    widgets: [
      'Доход за неделю',
      'Долги по классам',
      'AI-прогноз доходов',
      'Фонд зарплат',
      'Отклонения расходов'
    ]
  },
  {
    id: 'hr',
    name: 'HR',
    icon: <FaUsers />,
    color: 'bg-purple-500',
    widgets: [
      'Сейчас работают',
      'Нагрузка учителей',
      'KPI персонала',
      'Фиктивные позиции',
      'Отсутствующие сотрудники'
    ]
  },
  {
    id: 'erp',
    name: 'ERP/Безопасность',
    icon: <FaShieldAlt />,
    color: 'bg-red-500',
    widgets: [
      'Инциденты безопасности',
      'Здоровье систем',
      'Контроль доступа',
      'Мониторинг сети',
      'Статус резервных копий'
    ]
  },
  {
    id: 'ai',
    name: 'AI-аналитика',
    icon: <FaRobot />,
    color: 'bg-yellow-500',
    widgets: [
      'Прогноз успеваемости',
      'Прогноз посещаемости',
      'Анализ обучения',
      'Оптимизация ресурсов',
      'Анализ методик'
    ]
  },
  {
    id: 'communications',
    name: 'Коммуникации',
    icon: <FaComments />,
    color: 'bg-indigo-500',
    widgets: [
      'Сообщения',
      'Общение с родителями',
      'Уведомления',
      'Расписание встреч',
      'Групповые чаты'
    ]
  },
  {
    id: 'todo',
    name: 'Задачи',
    icon: <FaTasks />,
    color: 'bg-pink-500',
    widgets: [
      'Личные задачи',
      'Командные задачи',
      'Дедлайны',
      'Приоритеты',
      'Прогресс'
    ]
  },
  {
    id: 'events',
    name: 'События/Дедлайны',
    icon: <FaCalendarAlt />,
    color: 'bg-orange-500',
    widgets: [
      'Ближайшие события',
      'Отслеживание дедлайнов',
      'Напоминания',
      'Посещаемость событий',
      'Анализ трендов'
    ]
  }
];

export const AddWidgetModal: React.FC<AddWidgetModalProps> = ({
  isOpen,
  onClose,
  onAddWidget
}) => {
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);

  const handleSelectWidget = (category: string, widget: string) => {
    onAddWidget(category, widget);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl p-6 w-full max-w-4xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">
            {selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : 'Добавить виджет'}
          </h2>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <FaTimes size={20} />
          </motion.button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map(category => (
            <motion.div
              key={category.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                p-4 rounded-xl cursor-pointer
                ${selectedCategory === category.id ? 'ring-2 ring-corporate-primary' : 'hover:bg-gray-50'}
              `}
              onClick={() => setSelectedCategory(category.id)}
            >
              <div className={`w-12 h-12 ${category.color} rounded-lg flex items-center justify-center text-white mb-3`}>
                {category.icon}
              </div>
              <h3 className="font-medium text-gray-900">{category.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{category.widgets.length} виджетов</p>
            </motion.div>
          ))}
        </div>

        {selectedCategory && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 pt-6 border-t"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories
                .find(c => c.id === selectedCategory)
                ?.widgets.map((widget, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="p-4 rounded-lg border hover:border-corporate-primary cursor-pointer"
                    onClick={() => handleSelectWidget(selectedCategory, widget)}
                  >
                    <h4 className="font-medium text-gray-900">{widget}</h4>
                  </motion.div>
                ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}; 