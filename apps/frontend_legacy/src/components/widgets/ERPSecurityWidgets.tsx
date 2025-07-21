import React from 'react';
import { motion } from 'framer-motion';
import { 
  FaShieldAlt,
  FaUserSecret,
  FaExclamationTriangle,
  FaDatabase,
  FaNetworkWired
} from 'react-icons/fa';

export const SecurityIncidentsWidget: React.FC = () => {
  const incidents = [
    {
      type: 'Попытка несанкционированного доступа',
      location: 'Кабинет 305',
      time: '14:30',
      severity: 'high'
    },
    {
      type: 'Подозрительная активность',
      location: 'Сервер базы данных',
      time: '13:45',
      severity: 'medium'
    },
    {
      type: 'Нарушение политики безопасности',
      location: 'Wi-Fi сеть',
      time: '12:20',
      severity: 'low'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FaShieldAlt className="text-red-500" />
          <span className="text-sm font-medium">Инциденты безопасности</span>
        </div>
        <span className="text-sm text-red-500 font-medium">3 активных</span>
      </div>
      {incidents.map((incident, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`p-3 rounded-lg border-l-4 ${
            incident.severity === 'high' ? 'border-red-500 bg-red-50' :
            incident.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
            'border-blue-500 bg-blue-50'
          }`}
        >
          <div className="text-sm font-medium">{incident.type}</div>
          <div className="text-xs text-gray-500">{incident.location}</div>
          <div className="text-xs text-gray-500 mt-1">{incident.time}</div>
        </motion.div>
      ))}
    </div>
  );
};

export const SystemHealthWidget: React.FC = () => {
  const systems = [
    { name: 'База данных', status: 'healthy', load: 65 },
    { name: 'Веб-сервер', status: 'warning', load: 85 },
    { name: 'Файловое хранилище', status: 'healthy', load: 45 },
    { name: 'Система резервирования', status: 'critical', load: 95 }
  ];

  return (
    <div className="space-y-4">
      {systems.map((system, index) => (
        <motion.div
          key={system.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="p-3 bg-gray-50 rounded-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{system.name}</span>
            <span className={`text-xs font-medium ${
              system.status === 'healthy' ? 'text-green-500' :
              system.status === 'warning' ? 'text-yellow-500' :
              'text-red-500'
            }`}>
              {system.status === 'healthy' ? 'Стабильно' :
               system.status === 'warning' ? 'Внимание' : 'Критично'}
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${system.load}%` }}
              transition={{ duration: 1 }}
              className={`h-full ${
                system.load > 90 ? 'bg-red-500' :
                system.load > 70 ? 'bg-yellow-500' :
                'bg-green-500'
              }`}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Нагрузка: {system.load}%
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export const AccessControlWidget: React.FC = () => {
  const accessLogs = [
    {
      user: 'Петров И.А.',
      action: 'Вход в систему',
      time: '14:30',
      status: 'success'
    },
    {
      user: 'Неизвестный',
      action: 'Попытка входа',
      time: '14:25',
      status: 'failed'
    },
    {
      user: 'Алиева Г.К.',
      action: 'Доступ к файлам',
      time: '14:20',
      status: 'success'
    }
  ];

  return (
    <div className="space-y-4">
      {accessLogs.map((log, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
        >
          <div>
            <div className="text-sm font-medium">{log.user}</div>
            <div className="text-xs text-gray-500">{log.action}</div>
          </div>
          <div className="text-right">
            <div className={`text-xs font-medium ${
              log.status === 'success' ? 'text-green-500' : 'text-red-500'
            }`}>
              {log.status === 'success' ? 'Успешно' : 'Отказано'}
            </div>
            <div className="text-xs text-gray-500">{log.time}</div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export const NetworkMonitoringWidget: React.FC = () => {
  const networks = [
    { name: 'Основная сеть', status: 'active', users: 45, bandwidth: 80 },
    { name: 'Гостевой Wi-Fi', status: 'active', users: 12, bandwidth: 30 },
    { name: 'VPN', status: 'issues', users: 8, bandwidth: 95 }
  ];

  return (
    <div className="space-y-4">
      {networks.map((network, index) => (
        <motion.div
          key={network.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="p-3 bg-gray-50 rounded-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <FaNetworkWired className={network.status === 'active' ? 'text-green-500' : 'text-red-500'} />
              <span className="text-sm font-medium">{network.name}</span>
            </div>
            <span className="text-xs text-gray-500">{network.users} пользователей</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${network.bandwidth}%` }}
              transition={{ duration: 1 }}
              className={`h-full ${
                network.bandwidth > 90 ? 'bg-red-500' :
                network.bandwidth > 70 ? 'bg-yellow-500' :
                'bg-green-500'
              }`}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Загрузка канала: {network.bandwidth}%
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export const BackupStatusWidget: React.FC = () => {
  const backups = [
    {
      type: 'Полное резервирование',
      lastBackup: '2024-03-20 02:00',
      status: 'success',
      size: '1.2 TB'
    },
    {
      type: 'Инкрементальное',
      lastBackup: '2024-03-21 02:00',
      status: 'warning',
      size: '250 GB'
    },
    {
      type: 'База данных',
      lastBackup: '2024-03-21 03:00',
      status: 'success',
      size: '500 GB'
    }
  ];

  return (
    <div className="space-y-4">
      {backups.map((backup, index) => (
        <motion.div
          key={backup.type}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="p-3 bg-gray-50 rounded-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium">{backup.type}</div>
            <div className={`text-xs font-medium ${
              backup.status === 'success' ? 'text-green-500' :
              backup.status === 'warning' ? 'text-yellow-500' :
              'text-red-500'
            }`}>
              {backup.status === 'success' ? 'Успешно' :
               backup.status === 'warning' ? 'Внимание' : 'Ошибка'}
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Последнее обновление: {backup.lastBackup}
          </div>
          <div className="text-xs text-gray-500">
            Размер: {backup.size}
          </div>
        </motion.div>
      ))}
    </div>
  );
}; 