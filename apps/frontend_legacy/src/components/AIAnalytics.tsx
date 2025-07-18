import React from 'react';
import { motion } from 'framer-motion';
import {
  FaChartLine,
  FaHeart,
  FaGraduationCap,
  FaExclamationCircle,
  FaArrowUp,
  FaArrowDown
} from 'react-icons/fa';

interface RiskCardProps {
  title: string;
  description: string;
  trend: 'up' | 'down';
  value: string;
  color: string;
}

const RiskCard: React.FC<RiskCardProps> = ({ title, description, trend, value, color }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-notion"
  >
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      <div className={`flex items-center ${trend === 'up' ? 'text-red-500' : 'text-green-500'}`}>
        {trend === 'up' ? <FaArrowUp /> : <FaArrowDown />}
        <span className="ml-1">{value}</span>
      </div>
    </div>
    <p className="text-sm text-gray-600">{description}</p>
  </motion.div>
);

const AIAnalytics: React.FC = () => {
  const risks = [
    {
      title: 'Прогноз отчислений',
      description: 'AI предсказывает увеличение отчислений на 15% в следующем семестре',
      trend: 'up' as const,
      value: '+15%',
      color: 'red-500'
    },
    {
      title: 'Эмоциональное состояние',
      description: 'Класс XI-Б показывает признаки повышенного стресса',
      trend: 'down' as const,
      value: '-8%',
      color: 'yellow-500'
    },
    {
      title: 'Успеваемость',
      description: 'Риск падения успеваемости по математике в 10-х классах',
      trend: 'down' as const,
      value: '-12%',
      color: 'red-500'
    },
    {
      title: 'Отклонения',
      description: 'Обнаружены несоответствия в расписании 3-х преподавателей',
      trend: 'up' as const,
      value: '+3',
      color: 'yellow-500'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">AI-аналитика: управление рисками</h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-4 py-2" style={{ backgroundColor: '#1C7E66', color: 'white', borderRadius: '0.5rem', fontSize: '0.875rem' }}
        >
          Обновить данные
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {risks.map((risk, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <RiskCard {...risk} />
          </motion.div>
        ))}
      </div>

      {/* График прогноза */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-notion"
      >
        <h3 className="text-lg font-medium text-gray-900 mb-4">Прогноз успеваемости</h3>
        <div className="h-64 flex items-end justify-between space-x-2">
          {[65, 70, 68, 75, 72, 80, 78, 82, 85, 88].map((value, index) => (
            <motion.div
              key={index}
              initial={{ height: 0 }}
              animate={{ height: `${value}%` }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="w-8 rounded-t-lg relative" style={{ backgroundColor: '#1C7E661A' }}
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

export default AIAnalytics; 