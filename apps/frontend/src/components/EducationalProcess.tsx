import React from 'react';
import { motion } from 'framer-motion';
import { 
  FaCalendarAlt, 
  FaMapMarkedAlt, 
  FaPlus, 
  FaBuilding,
  FaUsers,
  FaChalkboardTeacher
} from 'react-icons/fa';

interface QuickActionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const QuickAction: React.FC<QuickActionProps> = ({ icon, title, description }) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-notion w-full text-left"
  >
    <div className="flex items-center">
      <div className="text-corporate-primary mr-4">{icon}</div>
      <div>
        <h3 className="font-medium text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  </motion.button>
);

const EducationalProcess: React.FC = () => {
  const quickActions = [
    {
      icon: <FaPlus size={24} />,
      title: 'Создать секцию',
      description: 'Добавить новую учебную секцию'
    },
    {
      icon: <FaBuilding size={24} />,
      title: 'Добавить аудиторию',
      description: 'Зарегистрировать новую аудиторию'
    },
    {
      icon: <FaUsers size={24} />,
      title: 'Управление группами',
      description: 'Создать или изменить группы'
    }
  ];

  const scheduleStatus = [
    { title: 'Преподаватели', value: '92%', color: 'bg-green-500' },
    { title: 'Аудитории', value: '88%', color: 'bg-yellow-500' },
    { title: 'Группы', value: '95%', color: 'bg-blue-500' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Управление учебным процессом</h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-4 py-2 bg-corporate-primary text-white rounded-lg text-sm"
        >
          Создать расписание
        </motion.button>
      </div>

      {/* Быстрые действия */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickActions.map((action, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <QuickAction {...action} />
          </motion.div>
        ))}
      </div>

      {/* Статус расписания */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-notion">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Состояние расписания</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {scheduleStatus.map((status, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center space-x-3"
            >
              <div className={`w-2 h-2 rounded-full ${status.color}`} />
              <div>
                <p className="text-sm text-gray-600">{status.title}</p>
                <p className="text-lg font-semibold text-gray-900">{status.value}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Карта загруженности */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-notion"
      >
        <h3 className="text-lg font-medium text-gray-900 mb-4">Загруженность по неделям</h3>
        <div className="h-48 flex items-end justify-between space-x-2">
          {[40, 65, 85, 75, 90, 70, 60].map((value, index) => (
            <motion.div
              key={index}
              initial={{ height: 0 }}
              animate={{ height: `${value}%` }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="w-8 bg-corporate-primary/20 rounded-t-lg relative"
            >
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-600">
                {value}%
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default EducationalProcess; 