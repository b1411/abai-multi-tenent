import React from 'react';
import { motion } from 'framer-motion';
import { 
  FaUsers, 
  FaExclamationTriangle, 
  FaMoneyBillWave, 
  FaBrain,
  FaChartLine,
  FaUserGraduate,
  FaUserTie,
  FaClock,
  FaUserSlash
} from 'react-icons/fa';

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, change, isPositive, color }) => (
  <motion.div 
    whileHover={{ scale: 1.02 }}
    className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-notion"
  >
    <div className="flex items-center justify-between">
      <div className={`text-${color}`}>{icon}</div>
      <div className={`text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
        {change}
      </div>
    </div>
    <div className="mt-2">
      <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
      <p className="text-sm text-gray-600">{title}</p>
    </div>
  </motion.div>
);

const AlertCard: React.FC<{ message: string; type: 'warning' | 'success' | 'error' }> = ({ message, type }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-notion border-l-4 ${
      type === 'warning' ? 'border-yellow-500' :
      type === 'success' ? 'border-green-500' :
      'border-red-500'
    }`}
  >
    <div className="flex items-center">
      <FaBrain className="text-corporate-primary mr-3" />
      <p className="text-sm text-gray-700">{message}</p>
    </div>
  </motion.div>
);

const StrategicSummary: React.FC = () => {
  const stats = [
    { 
      icon: <FaUserGraduate size={24} />, 
      title: 'Учащиеся', 
      value: '3,654', 
      change: '+1.2%', 
      isPositive: true,
      color: 'corporate-primary'
    },
    { 
      icon: <FaUserTie size={24} />, 
      title: 'Преподаватели', 
      value: '284', 
      change: '+0.8%', 
      isPositive: true,
      color: 'corporate-primary'
    },
    { 
      icon: <FaUsers size={24} />, 
      title: 'Сотрудники', 
      value: '162', 
      change: '+0.5%', 
      isPositive: true,
      color: 'corporate-primary'
    },
    { 
      icon: <FaExclamationTriangle size={24} />, 
      title: 'Инциденты сегодня', 
      value: '12', 
      change: '+2', 
      isPositive: false,
      color: 'yellow-500'
    },
    { 
      icon: <FaClock size={24} />, 
      title: 'Опоздания', 
      value: '8', 
      change: '-1', 
      isPositive: true,
      color: 'yellow-500'
    },
    { 
      icon: <FaUserSlash size={24} />, 
      title: 'Пропуски', 
      value: '4', 
      change: '+1', 
      isPositive: false,
      color: 'yellow-500'
    },
    { 
      icon: <FaMoneyBillWave size={24} />, 
      title: 'Поступило', 
      value: '₸2.4M', 
      change: '+15%', 
      isPositive: true,
      color: 'green-500'
    },
    { 
      icon: <FaChartLine size={24} />, 
      title: 'Задолженность', 
      value: '₸180K', 
      change: '-5%', 
      isPositive: true,
      color: 'red-500'
    }
  ];

  const alerts = [
    {
      message: "Система обнаружила учащихся с критически низким прогрессом",
      type: 'warning' as const
    },
    {
      message: "Резкое падение платежей в классе XI-А",
      type: 'error' as const
    }
  ];

  return (
    <div className="space-y-6">
      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <StatCard {...stat} />
          </motion.div>
        ))}
      </div>

      {/* AI-предупреждения */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {alerts.map((alert, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.2 }}
          >
            <AlertCard {...alert} />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default StrategicSummary; 